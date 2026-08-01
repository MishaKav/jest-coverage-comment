import * as core from '@actions/core'
import { existsSync } from 'fs'
import { CoverageLine, Options } from './types.d'
import { getContentFile, getPathToFile } from './utils'
import { isFile, isFolder } from './parse-coverage'

/** Get parent directory of a file path ('' when there is none). */
function parentDir(filePath: string): string {
  return filePath.split('/').slice(0, -1).join('/')
}

/** Extract repo-relative file paths from coverage-summary.json content. */
function getPathCandidates(jsonContent: string, prefix: string): string[] {
  if (!jsonContent || !prefix) {
    return []
  }

  const dirPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`

  try {
    const json = JSON.parse(jsonContent)
    return Object.keys(json)
      .filter((key) => key !== 'total' && key.startsWith(dirPrefix))
      .map((key) => key.slice(dirPrefix.length))
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Parse summary report for coverage paths. ${error.message}`)
    }
  }

  return []
}

/** Find the only candidate that ends with the truncated path, if any. */
function matchCandidate(file: string, candidates: string[]): string | null {
  if (candidates.includes(file)) {
    return null
  }

  const matches = candidates.filter((c) => c.endsWith(`/${file}`))
  return matches.length === 1 ? matches[0] : null
}

/** Restore parent directories stripped by istanbul's text reporter. */
function restorePaths(
  coverageArr: CoverageLine[],
  candidates: string[]
): CoverageLine[] {
  const fixedFiles = new Map<string, string>()
  const result = coverageArr.map((line) => {
    if (!isFile(line)) {
      return line
    }

    const fixed = matchCandidate(line.file, candidates)
    if (!fixed) {
      return line
    }

    fixedFiles.set(line.file, fixed)
    return { ...line, file: fixed }
  })

  return result.map((line) => {
    if (!isFolder(line) || line.file === 'All files') {
      return line
    }

    for (const [original, fixed] of fixedFiles) {
      if (parentDir(original) === line.file) {
        return { ...line, file: parentDir(fixed) }
      }
    }

    return line
  })
}

/**
 * Fix truncated paths produced by `jest --changedSince` / `--findRelatedTests`.
 * Istanbul's text reporter strips the common parent directory of all covered
 * files, so restore it from the full paths in coverage-summary.json.
 */
export function fixCoverageFilePaths(
  coverageArr: CoverageLine[],
  options: Options
): CoverageLine[] {
  const { summaryFile, prefix, coveragePathPrefix } = options

  if (coveragePathPrefix || !prefix || !summaryFile) {
    return coverageArr
  }

  try {
    if (!existsSync(getPathToFile(summaryFile))) {
      return coverageArr
    }

    const jsonContent = getContentFile(summaryFile)
    const candidates = getPathCandidates(jsonContent, prefix)

    if (!candidates.length) {
      return coverageArr
    }

    const result = restorePaths(coverageArr, candidates)
    const restored = result.filter((l, i) => l.file !== coverageArr[i].file)

    if (restored.length) {
      core.info(
        `Restored ${restored.length} coverage path(s) from '${summaryFile}'`
      )
    }

    const unresolved = result.filter(
      (line) => isFile(line) && !candidates.includes(line.file)
    )

    if (unresolved.length) {
      core.warning(
        `Could not restore coverage path(s): ${unresolved
          .map((line) => line.file)
          .join(', ')}`
      )
    }

    return result
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Restoring coverage paths. ${error.message}`)
    }
  }

  return coverageArr
}

export const exportedForTesting = {
  parentDir,
  getPathCandidates,
  matchCandidate,
  restorePaths,
}
