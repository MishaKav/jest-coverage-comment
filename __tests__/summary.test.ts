import { expect, test, describe } from '@jest/globals'
import {
  getSummaryReport,
  parseSummary,
  exportedForTesting,
  summaryToMarkdown,
  getCoverage,
} from '../src/summary'
import { Options } from '../src/types'
import { getContentFile } from '../src/utils'
import { spyCore } from './setup'

const { lineSummaryToTd } = exportedForTesting

describe('coverage from summary', () => {
  test('should extract coverage from summary', () => {
    const coverage = getCoverage({ lines: { pct: 78.57 } } as never)

    expect(coverage.color).toBe('yellow')
    expect(coverage.coverage).toBe(78)
  })

  test('should return default coverage from summary', () => {
    const coverage = getCoverage({} as never)

    expect(coverage.color).toBe('red')
    expect(coverage.coverage).toBe(0)
  })
})

describe('summary to td', () => {
  test('should parse summary to td', () => {
    const line = lineSummaryToTd({
      total: 42,
      covered: 33,
      pct: 78.57,
    } as never)
    expect(line).toBe('78.57% (33/42)')
  })

  test('should return default summary to td', () => {
    const red = lineSummaryToTd({} as never)
    expect(red).toBe('')
  })
})

describe('parse summary', () => {
  const options: Options = {
    token: 'token_123',
    serverUrl: 'https://github.com',
    repository: 'MishaKav/jest-coverage-comment',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: '<!-- Jest Coverage Comment: 1 -->\n',
    summaryTitle: '',
    prefix: '',
    badgeTitle: 'Coverage',
    summaryFile: `${__dirname}/../data/coverage_1/coverage-summary.json`,
  }

  test('should return summary report', () => {
    const { summaryHtml, coverage, color } = getSummaryReport(options)

    expect(summaryHtml).toMatchInlineSnapshot(`
      "| Lines | Statements | Branches | Functions |
      | --- | --- | --- | --- |
      | <a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/README.md"><img alt="Coverage: 78%" src="https://img.shields.io/badge/Coverage-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
      "
    `)
    expect(coverage).toBe(78)
    expect(color).toBe('yellow')
  })

  test('should render summary title', () => {
    const optionsWithTitle = { ...options, summaryTitle: 'summaryTitle' }
    const { summaryHtml } = getSummaryReport(optionsWithTitle)

    expect(summaryHtml).toContain(`## ${optionsWithTitle.summaryTitle}`)
  })

  test('should return default summary', () => {
    const { summaryHtml, coverage, color } = getSummaryReport({} as never)

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
    const parsedSummary = parseSummary('bad content')

    expect(parsedSummary).toBeNull()
    expect(spyCore.error).toHaveBeenCalledTimes(1)
    expect(spyCore.error).toHaveBeenCalledWith(
      'Parse summary report. Unexpected token \'b\', "bad content" is not valid JSON'
    )
  })
})

describe('summary to markdown', () => {
  const options: Options = {
    token: 'token_123',
    repository: 'MishaKav/jest-coverage-comment',
    serverUrl: 'https://github.com',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: '<!-- Jest Coverage Comment: 1 -->\n',
    summaryTitle: '',
    prefix: '',
    badgeTitle: 'Coverage',
    summaryFile: `${__dirname}/../data/coverage_1/coverage-summary.json`,
  }
  const jsonContent = getContentFile(options.summaryFile)
  const summary = parseSummary(jsonContent)
  if (!summary) {
    throw new Error('summary is expected to not be null')
  }

  test('should convert summary to markdown with title', () => {
    const parsedSummary = summaryToMarkdown(summary, options, false)
    expect(parsedSummary).toMatchInlineSnapshot(`
      "| Lines | Statements | Branches | Functions |
      | --- | --- | --- | --- |
      | <a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/README.md"><img alt="Coverage: 78%" src="https://img.shields.io/badge/Coverage-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
      "
    `)
  })

  test('should convert summary to markdown without title', () => {
    const parsedSummary = summaryToMarkdown(summary, options, true)
    expect(parsedSummary).toMatchInlineSnapshot(
      `"| <a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/README.md"><img alt="Coverage: 78%" src="https://img.shields.io/badge/Coverage-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |"`
    )
  })

  test('should convert summary to markdown with text instead of badge', () => {
    const optionsWithText = { ...options, textInsteadBadge: true }
    const parsedSummary = summaryToMarkdown(summary, optionsWithText, false)
    expect(parsedSummary).toMatchInlineSnapshot(`
      "| Lines | Statements | Branches | Functions |
      | --- | --- | --- | --- |
      | 78.57% (33/42) | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
      "
    `)
  })

  test('should convert summary to markdown with text instead of badge without header', () => {
    const optionsWithText = { ...options, textInsteadBadge: true }
    const parsedSummary = summaryToMarkdown(summary, optionsWithText, true)
    expect(parsedSummary).toMatchInlineSnapshot(
      `"| 78.57% (33/42) | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |"`
    )
  })
})

describe('coverage when have default values', () => {
  const options: Options = {
    token: 'token_123',
    repository: 'MishaKav/jest-coverage-comment',
    serverUrl: 'https://github.com',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: '<!-- Jest Coverage Comment: 1 -->\n',
    summaryTitle: '',
    prefix: '',
    badgeTitle: 'Coverage',
    summaryFile: './coverage/coverage-summary.json',
    multipleFiles: ['Title1, some/path/to/file/coverage.json'],
  }

  test('should ignore warning when summaryFile have default value and have multiple-files', () => {
    const { summaryHtml, coverage, color } = getSummaryReport(options)

    expect(summaryHtml).toBe('')
    expect(coverage).toBe(0)
    expect(color).toBe('red')
    expect(spyCore.warning).toHaveBeenCalledTimes(0)
  })
})
