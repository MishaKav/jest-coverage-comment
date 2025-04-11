import * as core from '@actions/core'
import { CoverageLine, CoverageReport, Options } from './types.d'
import { getContentFile, getCoverageColor } from './utils'
import { parseCoverage, getTotalLine, isFile, isFolder } from './parse-coverage'

const DEFAULT_COVERAGE: Omit<CoverageReport, 'coverageHtml'> = {
  coverage: 0,
  color: 'red',
  branches: 0,
  functions: 0,
  lines: 0,
  statements: 0,
}

/** Convert coverage to md. */
function coverageToMarkdown(
  coverageArr: CoverageLine[],
  options: Options
): string {
  const { reportOnlyChangedFiles, coverageTitle } = options
  const { coverage } = getCoverage(coverageArr)

  const table = toTable(coverageArr, options)
  const onlyChanged = reportOnlyChangedFiles ? '• ' : ''
  const reportHtml = `<details><summary>${coverageTitle} ${onlyChanged}(<b>${coverage}%</b>)</summary>${table}</details>`

  return reportHtml
}

/** Get coverage and color from CoverageLine[]. */
function getCoverage(
  coverageArr: CoverageLine[]
): Omit<CoverageReport, 'coverageHtml'> {
  const allFilesLine = getTotalLine(coverageArr)

  if (!allFilesLine) {
    return DEFAULT_COVERAGE
  }

  const { lines, branch, funcs, stmts } = allFilesLine
  const color = getCoverageColor(lines)
  const coverage = parseInt(lines.toString())
  const branches = parseInt(branch.toString())
  const functions = parseInt(funcs.toString())
  const statements = parseInt(stmts.toString())

  return {
    color,
    coverage,
    branches,
    functions,
    statements,
    lines: coverage,
  }
}

/** Make html table from coverage.txt. */
function toTable(coverageArr: CoverageLine[], options: Options): string {
  for (const obj of coverageArr) {
    core.info(`CoverageArr ${JSON.stringify(obj)}`)
  }
  const headTr = toHeadRow()

  const totalRow = getTotalLine(coverageArr)
  const totalTr = toTotalRow(totalRow)

  const folders = makeFolders(coverageArr, options)
  const { reportOnlyChangedFiles, changedFiles } = options
  const rows = [totalTr]

  core.info(`Changed files ${JSON.stringify(changedFiles)}`)

  for (const key of Object.keys(folders)) {
    const files = folders[key]
      .filter((line) => {
        if (!reportOnlyChangedFiles) {
          return true
        }

        return changedFiles?.all.some((c) => c.includes(line.file))
      })
      // Filter folders without files
      .filter((_line, _i, arr) => {
        if (!reportOnlyChangedFiles) {
          return true
        }

        return arr.length > 1
      })
      .map((line) => toRow(line, isFile(line), options))
    rows.push(...files)
  }

  core.info(`Files ${JSON.stringify(rows)}`)

  const hasLines = rows.length > 1
  const isFilesChanged =
    reportOnlyChangedFiles && !hasLines
      ? '<i>report-only-changed-files is enabled. No files were changed in this commit :)</i>'
      : ''

  // prettier-ignore
  return `<table>${headTr}<tbody>${rows.join('')}</tbody></table>${isFilesChanged}`
}

/** Make html head row - th. */
function toHeadRow(): string {
  return '<tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr>'
}

/** Make html row - tr. */
function toRow(line: CoverageLine, indent = false, options: Options): string {
  const { stmts, branch, funcs, lines } = line

  const fileName = toFileNameTd(line, indent, options)
  const missing = toMissingTd(line, options)

  return `<tr><td>${
    isFolder(line) ? line.file : fileName
  }</td><td>${stmts}</td><td>${branch}</td><td>${funcs}</td><td>${lines}</td><td>${missing}</td></tr>`
}

/** Make summary row - tr. */
function toTotalRow(line: CoverageLine | undefined): string {
  if (!line) {
    return '&nbsp;'
  }

  const { file, stmts, branch, funcs, lines } = line
  return `<tr><td><b>${file}</b></td><td><b>${stmts}</b></td><td><b>${branch}</b></td><td><b>${funcs}</b></td><td><b>${lines}</b></td><td>&nbsp;</td></tr>`
}

/** Make fileName cell - td. */
function toFileNameTd(
  line: CoverageLine,
  indent = false,
  options: Options
): string {
  const {
    serverUrl = 'https://github.com',
    repository,
    prefix,
    commit,
    coveragePathPrefix,
    removeLinksToFiles,
  } = options
  const relative = line.file.replace(prefix, '')
  const href = `${serverUrl}/${repository}/blob/${commit}/${coveragePathPrefix}${relative}`
  const parts = relative.split('/')
  const last = parts[parts.length - 1]
  const space = indent ? '&nbsp; &nbsp;' : ''

  return removeLinksToFiles
    ? `${space}${last}`
    : `${space}<a href="${href}">${last}</a>`
}

/** Make missing cell - td. */
function toMissingTd(line: CoverageLine, options: Options): string {
  if (!line.uncoveredLines?.length) {
    return '&nbsp;'
  }

  return line.uncoveredLines
    .map((range) => {
      const {
        serverUrl = 'https://github.com',
        repository,
        commit,
        coveragePathPrefix,
        removeLinksToLines,
      } = options
      const [start, end = start] = range.split('-')
      const fragment = start === end ? `L${start}` : `L${start}-L${end}`
      const relative = line.file
      const href = `${serverUrl}/${repository}/blob/${commit}/${coveragePathPrefix}${relative}#${fragment}`
      const text = start === end ? start : `${start}&ndash;${end}`

      return removeLinksToLines ? text : `<a href="${href}">${text}</a>`
    })
    .join(', ')
}

/** Collapse all lines to folders structure. */
function makeFolders(
  coverageArr: CoverageLine[],
  options: Options
): { [key: string]: CoverageLine[] } {
  const folders: { [key: string]: CoverageLine[] } = {}

  for (const line of coverageArr) {
    if (line.file === 'All files') {
      continue
    }
    const parts = line.file.replace(options.prefix, '').split('/')
    const folder = isFile(line) ? parts.slice(0, -1).join('/') : line.file

    folders[folder] = folders[folder] || []
    folders[folder].push(line)
  }

  return folders
}

/** Return full html coverage report and coverage percentage. */
export function getCoverageReport(options: Options): CoverageReport {
  const { coverageFile } = options

  try {
    if (!coverageFile) {
      return { ...DEFAULT_COVERAGE, coverageHtml: '' }
    }

    const txtContent = getContentFile(coverageFile)
    const coverageArr = parseCoverage(txtContent)

    if (coverageArr) {
      const coverage = getCoverage(coverageArr)
      const coverageHtml = coverageToMarkdown(coverageArr, options)

      return { ...coverage, coverageHtml }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Generating coverage report. ${error.message}`)
    }
  }

  return { ...DEFAULT_COVERAGE, coverageHtml: '' }
}
