/* eslint-disable no-console */
import * as core from '@actions/core'
import { existsSync } from 'fs'
import { SummaryReport, LineSummary, Options, Summary } from './types.d'
import { getContentFile, getCoverageColor, getPathToFile } from './utils'

/** Parse coverage-summary.json to Summary object. */
export function parseSummary(jsonContent: string): Summary | null {
  if (!jsonContent) {
    core.warning('Summary JSON was not provided')
    return null
  }

  try {
    const json = JSON.parse(jsonContent)
    if (json.total.lines) {
      return json.total as Summary
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Parse summary report. ${error.message}`)
    }
  }

  return null
}

/** Extract info from line to text. */
function lineSummaryToTd(line: LineSummary): string {
  if (!line.pct) {
    return ''
  }

  const { total, covered, pct } = line
  return `${pct}% (${covered}/${total})`
}

/** Convert summary to md. */
export function summaryToMarkdown(
  summary: Summary,
  options: Options,
  withoutHeader = false
): string {
  const {
    repository,
    commit,
    badgeTitle,
    serverUrl = 'https://github.com',
    summaryTitle,
  } = options
  const { lines, statements, functions, branches } = summary
  const { color, coverage } = getCoverage(summary)
  const readmeHref = `${serverUrl}/${repository}/blob/${commit}/README.md`
  const badge = `<a href="${readmeHref}"><img alt="${badgeTitle}: ${coverage}%" src="https://img.shields.io/badge/${badgeTitle}-${coverage}%25-${color}.svg" /></a><br/>`

  const tableHeader =
    '| Lines | Statements | Branches | Functions |\n' +
    '| --- | --- | --- | --- |'

  const coverageType = summaryTitle?.includes('unit') ? 'unit' : 'integration'
  const netCoverageMain = parseInt(
    options.netCoverageMain ? options.netCoverageMain : '0'
  )

  console.log('Coverage type', coverageType)
  console.log('Net coverage main', netCoverageMain)

  const coverageChange =
    coverage === netCoverageMain
      ? '■ Unchanged'
      : coverage > netCoverageMain
      ? `▲ Increased (+${coverage - netCoverageMain}%)`
      : `▼ Decreased (${coverage - netCoverageMain}%)`

  console.log('Coverage change', coverageChange)

  const tableBody =
    ` | ${lineSummaryToTd(lines)} |` +
    ` ${lineSummaryToTd(statements)} |` +
    ` ${lineSummaryToTd(branches)} |` +
    ` ${lineSummaryToTd(functions)} |`
  const table = `${tableHeader}\n${tableBody}\n`

  if (withoutHeader) {
    return tableBody
  }

  if (summaryTitle) {
    const summaryTitleCase = summaryTitle
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    return `## ${summaryTitleCase}\n ${badge} ${coverageChange}\n\n${table}`
  }

  return table
}

/** Get coverage and color from summary. */
export function getCoverage(
  summary: Summary
): Omit<SummaryReport, 'summaryHtml'> {
  if (!summary?.lines) {
    return { coverage: 0, color: 'red' }
  }

  const { lines, statements, branches, functions } = summary

  const netCoverage = lines.pct + statements.pct + branches.pct + functions.pct

  const color = getCoverageColor(netCoverage)
  const coverage = parseInt(netCoverage.toString())

  return { color, coverage }
}

/** Return full html coverage report and coverage percentage. */
export function getSummaryReport(options: Options): SummaryReport {
  const defaultResponse: SummaryReport = {
    summaryHtml: '',
    coverage: 0,
    color: 'red',
  }
  const {
    summaryFile,
    junitFile,
    coverageFile,
    multipleFiles,
    multipleJunitFiles,
  } = options

  try {
    // https://github.com/MishaKav/jest-coverage-comment/issues/66
    // prevent warning when 'summaryFile' has default value and other options are provided
    if (summaryFile === './coverage/coverage-summary.json') {
      const fixedFilePath = getPathToFile(summaryFile)
      const fileExists = existsSync(fixedFilePath)
      if (
        !fileExists &&
        (junitFile ||
          coverageFile ||
          multipleFiles?.length ||
          multipleJunitFiles?.length)
      ) {
        return defaultResponse
      }
    }

    const jsonContent = getContentFile(summaryFile)
    const summary = parseSummary(jsonContent)

    if (summary) {
      const { color, coverage } = getCoverage(summary)
      const summaryHtml = summaryToMarkdown(summary, options)

      return { color, coverage, summaryHtml }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Generating summary report. ${error.message}`)
    }
  }

  return defaultResponse
}

export const exportedForTesting = {
  lineSummaryToTd,
  getCoverageColor,
}
