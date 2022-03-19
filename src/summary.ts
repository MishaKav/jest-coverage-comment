import * as core from '@actions/core'
import { LineSummary, Options, Summary } from './types.d'
import { getContentFile } from './utils'

// parse coverage-summary.json to Sumamry object
function parseSummary(jsonContent: string): Summary | null {
  try {
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
function lineSumamryToTd(line: LineSummary, bold = false): string {
  if (!line) {
    return ''
  }

  const { total, covered, pct } = line
  const percent = bold ? `**${pct}%**` : `${pct}%`
  return `${percent} (${covered}/${total})`
}

// convert summary to md
function summaryToMarkdown(summary: Summary, options: Options): string {
  const { lines, statements, functions, branches } = summary

  const table = `| Lines | Statements | Branches | Functions |
| ----- | ------- | -------- | -------- |
| ${lineSumamryToTd(lines, true)} | ${lineSumamryToTd(
    statements
  )} | ${lineSumamryToTd(functions)} | ${lineSumamryToTd(branches)} |
`

  if (options.summaryTitle) {
    return `## ${options.summaryTitle}
${table}`
  }

  return table
}

// return full html coverage report and coverage percenatge
export function getSummaryReport(options: Options): string {
  const { summaryFile } = options

  try {
    const jsonContent = getContentFile(summaryFile)
    const summary = parseSummary(jsonContent)
    return summary ? summaryToMarkdown(summary, options) : ''
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Generating summary report. ${error.message}`)
    }
  }

  return ''
}
