import * as core from '@actions/core'
import {
  CoverageColor,
  CoverageReport,
  LineSummary,
  Options,
  Summary,
} from './types.d'
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
function lineSumamryToTd(line: LineSummary): string {
  if (!line?.pct) {
    return ''
  }

  const { total, covered, pct } = line
  return `${pct}% (${covered}/${total})`
}

// convert summary to md
function summaryToMarkdown(summary: Summary, options: Options): string {
  const { repository, commit, badgeTitle } = options
  const { statements, functions, branches } = summary
  const { color, coverage } = getCoverage(summary)
  const readmeHref = `https://github.com/${repository}/blob/${commit}/README.md`
  const badge = `<a href="${readmeHref}"><img alt="${badgeTitle}" src="https://img.shields.io/badge/${badgeTitle}-${coverage}%25-${color}.svg" /></a><br/>`

  const table = `| Lines | Statements | Branches | Functions |
| ----- | ------- | -------- | -------- |
| ${badge} | ${lineSumamryToTd(statements)} | ${lineSumamryToTd(
    functions
  )} | ${lineSumamryToTd(branches)} |
`

  if (options.summaryTitle) {
    return `## ${options.summaryTitle}

${table}`
  }

  return table
}

// get coverage color
function getCoverageColor(percentage: number): CoverageColor {
  // https://shields.io/category/coverage
  const rangeColors: { color: CoverageColor; range: [number, number] }[] = [
    {
      color: 'red',
      range: [0, 40],
    },
    {
      color: 'orange',
      range: [40, 60],
    },
    {
      color: 'yellow',
      range: [60, 80],
    },
    {
      color: 'green',
      range: [80, 90],
    },
    {
      color: 'brightgreen',
      range: [90, 101],
    },
  ]

  const { color } =
    rangeColors.find(
      ({ range: [min, max] }) => percentage >= min && percentage < max
    ) || rangeColors[0]

  return color
}

// get coverage and color from summary
function getCoverage(summary: Summary): Omit<CoverageReport, 'html'> {
  if (!summary?.lines) {
    return { coverage: 0, color: 'red' }
  }

  const { lines } = summary

  const color = getCoverageColor(lines.pct)
  const coverage = parseInt(lines.pct.toString())

  return { color, coverage }
}

// return full html coverage report and coverage percenatge
export function getSummaryReport(options: Options): CoverageReport {
  const { summaryFile } = options

  try {
    const jsonContent = getContentFile(summaryFile)
    const summary = parseSummary(jsonContent)

    if (summary) {
      const { color, coverage } = getCoverage(summary)
      const html = summaryToMarkdown(summary, options)

      return { color, coverage, html }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Generating summary report. ${error.message}`)
    }
  }

  return { html: '', coverage: 0, color: 'red' }
}
