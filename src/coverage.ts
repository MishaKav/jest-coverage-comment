import * as core from '@actions/core'
import { CoverageLine, CoverageReport, Options } from './types.d'
import {
  ABSOLUTE_PATH_REGEX,
  encodePath,
  escapeHtmlAttr,
  getContentFile,
  getCoverageColor,
  getFileUrl,
  hasParentSegment,
  stripLineBreaks,
} from './utils'
import { parseCoverage, getTotalLine, isFile, isFolder } from './parse-coverage'
import { fixCoverageFilePaths } from './fix-coverage-paths'

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

  // a line starting with an html comment is a raw html block, so github
  // doesn't parse markdown in the table cells. The block ends with the line,
  // so text after it (e.g. in a readme) still renders as markdown, and a line
  // break (e.g. from a report value) must not end the block early
  return `<!-- jest-coverage-comment -->${stripLineBreaks(reportHtml)}`
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
  const headTr = toHeadRow()

  const totalRow = getTotalLine(coverageArr)
  const totalTr = toTotalRow(totalRow)

  const folders = makeFolders(coverageArr, options)
  const { reportOnlyChangedFiles, changedFiles } = options
  const rows = [totalTr]

  for (const key of Object.keys(folders)) {
    const files = folders[key]
      .filter((line) => {
        if (!reportOnlyChangedFiles) {
          return true
        }

        return changedFiles?.all.some((c) => c.includes(line.file))
      })
      // Filter folders without files
      .filter((line, _i, arr) => {
        if (!reportOnlyChangedFiles) {
          return true
        }

        return isFile(line) || arr.some(isFile)
      })
      .map((line) => toRow(line, isFile(line), options))
    rows.push(...files)
  }

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

/** Make html row - tr. Report values are untrusted (e.g. from a fork PR), so they are escaped. */
function toRow(line: CoverageLine, indent = false, options: Options): string {
  const { stmts, branch, funcs, lines } = line

  // one link per row, shared by the file name and the uncovered lines
  const fileHref = toFileHref(line, options)
  const fileName = toFileNameTd(
    line,
    indent,
    options,
    options.removeLinksToFiles ? null : fileHref
  )
  const missing = toMissingTd(
    line,
    options.removeLinksToLines ? null : fileHref
  )

  return `<tr><td>${
    isFolder(line) ? escapeHtmlAttr(line.file) : fileName
  }</td><td>${stmts}</td><td>${branch}</td><td>${funcs}</td><td>${lines}</td><td>${missing}</td></tr>`
}

/** Make summary row - tr. */
function toTotalRow(line: CoverageLine | undefined): string {
  if (!line) {
    return '&nbsp;'
  }

  const { file, stmts, branch, funcs, lines } = line
  return `<tr><td><b>${escapeHtmlAttr(file)}</b></td><td><b>${stmts}</b></td><td><b>${branch}</b></td><td><b>${funcs}</b></td><td><b>${lines}</b></td><td>&nbsp;</td></tr>`
}

/** Path of a report line relative to the repo root. */
function toRelativePath(line: CoverageLine, options: Options): string {
  return line.file.replace(options.prefix, '')
}

/** Link to a file of the report in the repo, null when it can't be linked safely. */
function toFileHref(line: CoverageLine, options: Options): string | null {
  const { prefix, coveragePathPrefix = '' } = options
  // windows reports use `\`, browsers treat it as `/` in links
  const relative = line.file
    .replace(/\\/g, '/')
    .replace(prefix.replace(/\\/g, '/'), '')

  // a path outside the workspace or with a `..` segment doesn't point into the repo
  if (ABSOLUTE_PATH_REGEX.test(relative) || hasParentSegment(relative)) {
    return null
  }

  return getFileUrl(options, `${coveragePathPrefix}${encodePath(relative)}`)
}

/** Make fileName cell - td. */
function toFileNameTd(
  line: CoverageLine,
  indent = false,
  options: Options,
  href: string | null
): string {
  const parts = toRelativePath(line, options).split('/')
  const last = parts[parts.length - 1]
  const space = indent ? '&nbsp; &nbsp;' : ''
  const fileName = escapeHtmlAttr(last)

  return href
    ? `${space}<a href="${escapeHtmlAttr(href)}">${fileName}</a>`
    : `${space}${fileName}`
}

/** Make missing cell - td. */
function toMissingTd(line: CoverageLine, href: string | null): string {
  if (!line.uncoveredLines?.length) {
    return '&nbsp;'
  }

  const fileHref = href && escapeHtmlAttr(href)
  // line numbers come from the report, encode them like the path
  const encode = (value: string): string =>
    encodeURIComponent(value.toWellFormed())

  return line.uncoveredLines
    .map((range) => {
      const [start, end = start] = range.split('-')
      const single = start === end
      const fragment = single
        ? `L${encode(start)}`
        : `L${encode(start)}-L${encode(end)}`
      const text = single
        ? escapeHtmlAttr(start)
        : `${escapeHtmlAttr(start)}&ndash;${escapeHtmlAttr(end)}`

      return fileHref ? `<a href="${fileHref}#${fragment}">${text}</a>` : text
    })
    .join(', ')
}

/** Collapse all lines to folders structure. */
function makeFolders(
  coverageArr: CoverageLine[],
  options: Options
): { [key: string]: CoverageLine[] } {
  // no prototype, a folder named e.g. `constructor` must not hit Object members
  const folders: { [key: string]: CoverageLine[] } = Object.create(null)

  for (const line of coverageArr) {
    if (line.file === 'All files') {
      continue
    }
    const parts = toRelativePath(line, options).split('/')
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
    const coverageArr = fixCoverageFilePaths(parseCoverage(txtContent), options)

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
