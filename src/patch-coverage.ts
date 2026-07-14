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
  prefix: string,
  pathPrefix: string
): LineHitsByFile {
  const byFile: LineHitsByFile = new Map()

  for (const [absPath, fileCoverage] of Object.entries(coverage)) {
    const relative = normalizePath(absPath, prefix, pathPrefix)
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

/**
 * Normalize a coverage file path to the same repo-relative form used for
 * changed files: strip the workspace prefix, then the coverage path prefix.
 */
function normalizePath(
  filePath: string,
  prefix: string,
  pathPrefix: string
): string {
  let relative = filePath.replace(prefix, '')
  if (pathPrefix) {
    relative = relative.replace(pathPrefix, '')
  }
  return relative
}

/** Build line-hit data from an lcov.info report (DA:<line>,<hits> records). */
function lineHitsFromLcov(
  content: string,
  prefix: string,
  pathPrefix: string
): LineHitsByFile {
  const byFile: LineHitsByFile = new Map()
  let currentFile: string | null = null
  let lineHits = new Map<number, number>()

  for (const raw of content.split('\n')) {
    const line = raw.trim()

    if (line.startsWith('SF:')) {
      currentFile = normalizePath(line.slice(3), prefix, pathPrefix)
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
  const pathPrefix = options.coveragePathPrefix || ''

  if (coverageFinalFile) {
    const resolved = getPathToFile(coverageFinalFile)
    if (existsSync(resolved)) {
      try {
        return lineHitsFromIstanbul(
          JSON.parse(getContentFile(coverageFinalFile)),
          prefix,
          pathPrefix
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
      return lineHitsFromLcov(
        getContentFile(coverageLcovFile),
        prefix,
        pathPrefix
      )
    }
  }

  core.warning(
    'Patch coverage: no line-level coverage source found (coverage-final.json or lcov.info); skipping incremental coverage.'
  )
  return null
}

const DEFAULT_SOURCE_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']

// Files that are source-like by extension but should never count as coverable.
const NON_COVERABLE = /(\.test\.|\.spec\.|\.d\.ts$|__tests__\/|__mocks__\/)/

/**
 * Decide whether a changed file without coverage data should still be counted
 * (as fully uncovered). This closes the gap where a brand-new, untested source
 * file is absent from the coverage report and would otherwise be skipped,
 * letting the gate pass at a misleading 100%.
 */
function isCoverableSource(file: string, options: Options): boolean {
  const extensions = (options.patchSourceExtensions || '')
    .split(',')
    .map((ext) => ext.trim())
    .filter(Boolean)
  const allowed = extensions.length ? extensions : DEFAULT_SOURCE_EXTENSIONS

  if (!allowed.some((ext) => file.endsWith(ext))) {
    return false
  }
  if (NON_COVERABLE.test(file)) {
    return false
  }
  if (options.patchExcludePattern) {
    try {
      if (new RegExp(options.patchExcludePattern).test(file)) {
        return false
      }
    } catch (error) {
      if (error instanceof Error) {
        core.warning(
          `Patch coverage: invalid patch-exclude-pattern ignored. ${error.message}`
        )
      }
    }
  }
  return true
}

/** Parse the configured threshold; returns null when unset/invalid (advisory). */
function parseThreshold(raw?: string): number | null {
  if (raw === undefined || raw === null || raw.trim() === '') {
    return null
  }
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
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
    if (!lines.length) {
      continue
    }

    const lineHits = lineHitsByFile.get(file)

    if (!lineHits) {
      // No coverage data for this file. Skip non-source files (docs, config,
      // fixtures); treat coverable source files as fully uncovered so a new,
      // untested file cannot slip past the gate.
      if (!isCoverableSource(file, options)) {
        continue
      }
      totalChanged += lines.length
      files.push({
        file,
        coveredLines: 0,
        totalLines: lines.length,
        coverage: 0,
        uncoveredLines: [...lines],
        instrumented: false,
      })
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
      instrumented: true,
    })
  }

  // No changed executable lines => nothing to gate on; treat as fully covered.
  const pct = totalChanged === 0 ? 100 : (coveredChanged / totalChanged) * 100
  const rounded = Math.round(pct * 100) / 100
  const color: CoverageColor = getCoverageColor(rounded)
  const threshold = parseThreshold(options.patchThreshold)
  const meetsThreshold = threshold === null ? null : rounded >= threshold

  return {
    coverage: rounded,
    color,
    coveredLines: coveredChanged,
    totalLines: totalChanged,
    files,
    threshold,
    meetsThreshold,
  }
}

// Cap how many uncovered lines we render per file to keep the comment readable.
const MAX_UNCOVERED_LINKS = 25

/** Render the patch coverage section as markdown for the PR comment. */
export function patchCoverageToMarkdown(
  patch: PatchCoverage,
  options: Options
): string {
  // Nothing testable changed => explicitly say so; the gate treats this as a pass.
  if (patch.totalLines === 0) {
    return '## \u2705 Incremental coverage\nNo changed executable lines in this PR \u2014 nothing to cover.'
  }

  const pct = `${patch.coverage}%`
  const ratio = `**${patch.coveredLines}/${patch.totalLines}** changed lines covered`
  const required =
    patch.threshold !== null ? ` (required \u2265 ${patch.threshold}%)` : ''

  let heading: string
  let lead: string

  if (patch.meetsThreshold === false) {
    heading = `## \u274c Incremental coverage: ${pct}${required}`
    lead =
      `This PR is **blocked**: ${ratio}. Cover the lines below to reach \u2265 ${patch.threshold}%. ` +
      `Genuinely untestable lines can be excluded via your coverage config (\`collectCoverageFrom\` / nyc \`all\`) or the action's \`patch-exclude-pattern\`.`
  } else if (patch.meetsThreshold === true) {
    heading = `## \u2705 Incremental coverage: ${pct}${required}`
    lead = `${ratio}.`
  } else {
    heading = `## Incremental coverage: ${pct}`
    lead = `${ratio} _(advisory \u2014 not blocking)_.`
  }

  const sections = [heading, lead]

  if (patch.files.length) {
    const table = renderFileTable(patch, options)
    // Show the actionable table up-front when blocked; collapse it otherwise.
    sections.push(
      patch.meetsThreshold === false
        ? table
        : `<details><summary>Coverage of changed files</summary>\n\n${table}\n\n</details>`
    )
  }

  return sections.join('\n\n')
}

function renderFileTable(patch: PatchCoverage, options: Options): string {
  const {
    serverUrl = 'https://github.com',
    repository,
    commit,
    coveragePathPrefix = '',
  } = options

  const rows = patch.files
    .map((f) => {
      const ratio = `${f.coveredLines}/${f.totalLines}`

      let coverageCell: string
      let uncovered: string

      if (!f.instrumented) {
        coverageCell = `\u26a0\ufe0f new file (${ratio})`
        uncovered = '_no test coverage_'
      } else if (f.uncoveredLines.length) {
        coverageCell = `${f.coverage}% (${ratio})`
        const shown = f.uncoveredLines.slice(0, MAX_UNCOVERED_LINKS)
        const links = shown
          .map((line) => {
            const href = `${serverUrl}/${repository}/blob/${commit}/${coveragePathPrefix}${f.file}#L${line}`
            return `[${line}](${href})`
          })
          .join(', ')
        const extra = f.uncoveredLines.length - shown.length
        uncovered = extra > 0 ? `${links}, \u2026 (+${extra} more)` : links
      } else {
        coverageCell = `\u2705 100% (${ratio})`
        uncovered = '\u2014'
      }

      return `| \`${f.file}\` | ${coverageCell} | ${uncovered} |`
    })
    .join('\n')

  return [
    '| Changed file | Coverage | Uncovered lines |',
    '| :--- | :--- | :--- |',
    rows,
  ].join('\n')
}
