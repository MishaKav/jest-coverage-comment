import * as core from '@actions/core'
import { SummaryReport, LineSummary, Options, Summary } from './types.d'
import { getContentFile, getCoverageColor } from './utils'

// parse coverage-summary.json to Sumamry object
export function parseSummary(jsonContent: string): Summary | null {
  try {
    if (!jsonContent) {
      core.warning(`Summary json was not provided`)
      return null
    }

    const json = JSON.parse(jsonContent)
    if (json.total?.lines) {
      return json.total as Summary
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Parse summary report. ${error.message}`)
    }
  }

  return null
}

// extract info from line to text
function lineSumamryToTd(line: LineSummary): string {
  if (!line?.pct) {
    return ''
  }

  const { total, covered, pct } = line
  return `${pct}% (${covered}/${total})`
}

// convert summary to md
export function summaryToMarkdown(
  summary: Summary,
  options: Options,
  withoutHeader = false
): string {
  const { repository, commit, badgeTitle } = options
  const { statements, functions, branches } = summary
  const { color, coverage } = getCoverage(summary)
  const readmeHref = `https://github.com/${repository}/blob/${commit}/README.md`
  const badge = `<a href="${readmeHref}"><img alt="${badgeTitle}: ${coverage}%" src="https://img.shields.io/badge/${badgeTitle}-${coverage}%25-${color}.svg" /></a><br/>`

  const tableHeader = `| Lines | Statements | Branches | Functions |
| ----- | ------- | -------- | -------- |`
  // prettier-ignore
  const content = `| ${badge} | ${lineSumamryToTd(statements)} | ${lineSumamryToTd(functions)} | ${lineSumamryToTd(branches)} |`
  const table = `${tableHeader}
${content}
`

  if (withoutHeader) {
    return content
  }

  if (options.summaryTitle) {
    return `## ${options.summaryTitle}

${table}`
  }

  return table
}

// get coverage and color from summary
function getCoverage(summary: Summary): Omit<SummaryReport, 'summaryHtml'> {
  if (!summary?.lines) {
    return { coverage: 0, color: 'red' }
  }

  const { lines } = summary

  const color = getCoverageColor(lines.pct)
  const coverage = parseInt(lines.pct.toString())

  return { color, coverage }
}

// return full html coverage report and coverage percenatge
export function getSummaryReport(options: Options): SummaryReport {
  const { summaryFile } = options

  try {
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

  return { summaryHtml: '', coverage: 0, color: 'red' }
}

export const exportedForTesting = {
  getCoverage,
  lineSumamryToTd,
  getCoverageColor,
}
