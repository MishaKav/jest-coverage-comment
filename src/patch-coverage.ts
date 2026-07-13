import * as core from '@actions/core'
import { existsSync } from 'fs'
import {
  Options,
  PatchCoverage,
  PatchCoverageFile,
  CoverageColor,
} from './types.d'
import { getContentFile, getCoverageColor, getPathToFile } from './utils'

interface IstanbulStatement {
  start: { line: number; column: number }
  end: { line: number; column: number }
}

interface IstanbulFileCoverage {
  path?: string
  statementMap: Record<string, IstanbulStatement>
  s: Record<string, number>
}

type IstanbulCoverage = Record<string, IstanbulFileCoverage>

// Map of repo-relative file path -> (line number -> hit count).
type LineHitsByFile = Map<string, Map<number, number>>

/**
 * Build line-hit data from an Istanbul coverage-final.json. A line is coverable
 * when a statement starts on it and covered when any such statement executed.
 */
function lineHitsFromIstanbul(
  coverage: IstanbulCoverage,
  prefix: string
): LineHitsByFile {
  const byFile: LineHitsByFile = new Map()

  for (const [absPath, fileCoverage] of Object.entries(coverage)) {
    const relative = absPath.replace(prefix, '')
    const lineHits = new Map<number, number>()

    for (const [id, statement] of Object.entries(fileCoverage.statementMap)) {
      const line = statement.start?.line
      if (!line) {
        continue
      }
      const hits = fileCoverage.s[id] ?? 0
      lineHits.set(line, Math.max(lineHits.get(line) ?? 0, hits))
    }

    byFile.set(relative, lineHits)
  }

  return byFile
}

/** Build line-hit data from an lcov.info report (DA:<line>,<hits> records). */
function lineHitsFromLcov(content: string, prefix: string): LineHitsByFile {
  const byFile: LineHitsByFile = new Map()
  let currentFile: string | null = null
  let lineHits = new Map<number, number>()

  for (const raw of content.split('\n')) {
    const line = raw.trim()

    if (line.startsWith('SF:')) {
      currentFile = line.slice(3).replace(prefix, '')
      lineHits = new Map<number, number>()
    } else if (line.startsWith('DA:') && currentFile) {
      const [lineNo, hits] = line
        .slice(3)
        .split(',')
        .map((n) => parseInt(n, 10))
      if (!Number.isNaN(lineNo)) {
        lineHits.set(lineNo, Math.max(lineHits.get(lineNo) ?? 0, hits || 0))
      }
    } else if (line === 'end_of_record' && currentFile) {
      byFile.set(currentFile, lineHits)
      currentFile = null
    }
  }

  return byFile
}

/** Load line-hit data from whichever source is configured (Istanbul preferred). */
function loadLineHits(options: Options): LineHitsByFile | null {
  const { coverageFinalFile, coverageLcovFile, prefix } = options

  if (coverageFinalFile) {
    const resolved = getPathToFile(coverageFinalFile)
    if (existsSync(resolved)) {
      try {
        return lineHitsFromIstanbul(
          JSON.parse(getContentFile(coverageFinalFile)),
          prefix
        )
      } catch (error) {
        if (error instanceof Error) {
          core.error(
            `Patch coverage: failed to parse coverage-final. ${error.message}`
          )
        }
      }
    }
  }

  if (coverageLcovFile) {
    const resolved = getPathToFile(coverageLcovFile)
    if (existsSync(resolved)) {
      return lineHitsFromLcov(getContentFile(coverageLcovFile), prefix)
    }
  }

  core.warning(
    'Patch coverage: no line-level coverage source found (coverage-final.json or lcov.info); skipping incremental coverage.'
  )
  return null
}

/**
 * Compute incremental (patch) coverage: the percentage of changed executable
 * lines that are covered by tests. Returns null when the required data is
 * unavailable, so callers can keep the check advisory.
 */
export function getPatchCoverage(options: Options): PatchCoverage | null {
  const { changedFiles } = options

  if (!options.coverageFinalFile && !options.coverageLcovFile) {
    return null
  }

  if (!changedFiles?.changedLines) {
    core.warning(
      'Patch coverage: no changed-line information available (needs a pull_request or push event).'
    )
    return null
  }

  const lineHitsByFile = loadLineHits(options)
  if (!lineHitsByFile) {
    return null
  }

  const files: PatchCoverageFile[] = []
  let totalChanged = 0
  let coveredChanged = 0

  for (const [file, lines] of Object.entries(changedFiles.changedLines)) {
    const lineHits = lineHitsByFile.get(file)
    if (!lineHits) {
      // File has no coverage data (non-source or untested new file).
      continue
    }

    let fileTotal = 0
    let fileCovered = 0
    const uncoveredLines: number[] = []

    for (const line of lines) {
      if (!lineHits.has(line)) {
        // Line is not executable (blank, comment, type-only), ignore it.
        continue
      }
      fileTotal++
      if ((lineHits.get(line) ?? 0) > 0) {
        fileCovered++
      } else {
        uncoveredLines.push(line)
      }
    }

    if (fileTotal === 0) {
      continue
    }

    totalChanged += fileTotal
    coveredChanged += fileCovered
    files.push({
      file,
      coveredLines: fileCovered,
      totalLines: fileTotal,
      coverage: Math.round((fileCovered / fileTotal) * 100),
      uncoveredLines,
    })
  }

  // No changed executable lines => nothing to gate on; treat as fully covered.
  const pct = totalChanged === 0 ? 100 : (coveredChanged / totalChanged) * 100
  const rounded = Math.round(pct * 100) / 100
  const color: CoverageColor = getCoverageColor(rounded)

  return {
    coverage: rounded,
    color,
    coveredLines: coveredChanged,
    totalLines: totalChanged,
    files,
  }
}

/** Render the patch coverage section as markdown for the PR comment. */
export function patchCoverageToMarkdown(
  patch: PatchCoverage,
  options: Options
): string {
  const badgeUrl = `https://img.shields.io/badge/Incremental_Coverage-${patch.coverage}%25-${patch.color}.svg`
  const badge = `![Incremental Coverage: ${patch.coverage}%](${badgeUrl})`

  const summaryLine =
    patch.totalLines === 0
      ? '- Incremental coverage: no changed executable lines in this PR.'
      : `- Incremental (changed-line) coverage: ${badge} (${patch.coveredLines}/${patch.totalLines} changed lines covered)`

  if (!patch.files.length) {
    return summaryLine
  }

  const {
    serverUrl = 'https://github.com',
    repository,
    commit,
    coveragePathPrefix = '',
  } = options

  const header =
    '<tr><th>Changed File</th><th>% Covered</th><th>Covered / Total</th><th>Uncovered changed lines</th></tr>'

  const rows = patch.files
    .map((f) => {
      const uncovered = f.uncoveredLines.length
        ? f.uncoveredLines
            .map((line) => {
              const href = `${serverUrl}/${repository}/blob/${commit}/${coveragePathPrefix}${f.file}#L${line}`
              return `<a href="${href}">${line}</a>`
            })
            .join(', ')
        : '&nbsp;'
      return `<tr><td>${f.file}</td><td>${f.coverage}%</td><td>${f.coveredLines}/${f.totalLines}</td><td>${uncovered}</td></tr>`
    })
    .join('')

  const table = `<details><summary>Incremental coverage by file</summary><table>${header}<tbody>${rows}</tbody></table></details>`

  return `${summaryLine}\n\n${table}`
}
