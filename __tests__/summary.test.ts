import * as core from '@actions/core'
import { expect, test, describe, jest } from '@jest/globals'
import { getSummaryReport, exportedForTesting } from '../src/summary'
const { getCoverage, lineSumamryToTd, parseSummary } = exportedForTesting

describe('coverage from summary', () => {
  test('should extract coverage from summary', () => {
    // @ts-ignore
    const coverage = getCoverage({ lines: { pct: 78.57 } })

    expect(coverage.color).toBe('yellow')
    expect(coverage.coverage).toBe(78)
  })

  test('should return default coverage from summary', () => {
    // @ts-ignore
    const coverage = getCoverage({})

    expect(coverage.color).toBe('red')
    expect(coverage.coverage).toBe(0)
  })
})

describe('summary to td', () => {
  test('should parse summary to td', () => {
    // @ts-ignore
    const line = lineSumamryToTd({ total: 42, covered: 33, pct: 78.57 })
    expect(line).toBe(`78.57% (33/42)`)
  })

  test('should return default sumamry to td', () => {
    // @ts-ignore
    const red = lineSumamryToTd({})
    expect(red).toBe('')
  })
})

describe('parse summary', () => {
  const options = {
    token: 'token_123',
    repository: 'MishaKav/jest-coverage-comment',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: `<!-- Jest Coverage Comment: 1 -->\n`,
    summaryTitle: '',
    prefix: '',
    badgeTitle: 'Coverage',
    summaryFile: `${__dirname}/../data/coverage_1/coverage-summary.json`,
  }

  test('should return summary report', () => {
    const html = `| Lines | Statements | Branches | Functions |
| ----- | ------- | -------- | -------- |
| <a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/README.md"><img alt="Coverage: 78%" src="https://img.shields.io/badge/Coverage-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 33.33% (2/6) | 100% (0/0) |
`

    const { summaryHtml, coverage, color } = getSummaryReport(options)

    expect(summaryHtml).toEqual(html)
    expect(coverage).toBe(78)
    expect(color).toBe('yellow')
  })

  test('should render summary title', () => {
    const optionsWithTitle = { ...options, summaryTitle: 'summaryTitle' }
    const { summaryHtml } = getSummaryReport(optionsWithTitle)

    expect(summaryHtml).toContain(`## ${optionsWithTitle.summaryTitle}`)
  })

  test('should return default summary', () => {
    // @ts-ignore
    const { summaryHtml, coverage, color } = getSummaryReport({})

    expect(summaryHtml).toBe('')
    expect(coverage).toBe(0)
    expect(color).toBe('red')
  })
})

describe('should parse summary', () => {
  test('should parse summary', () => {
    const line = { total: 42, covered: 33, skipped: 0, pct: 78.57 }
    const total = {
      lines: line,
      statements: line,
      functions: line,
      branches: line,
      branchesTrue: line,
    }
    const summaryString = JSON.stringify({ total })
    const parsedSummary = parseSummary(summaryString)
    expect(parsedSummary).toEqual(expect.objectContaining(total))
  })

  test('should throw error on parsing', () => {
    const spy = jest.spyOn(core, 'error')
    const parsedSummary = parseSummary('bad content')

    expect(parsedSummary).toBeNull()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      `Parse summary report. Unexpected token b in JSON at position 0`
    )
  })
})
