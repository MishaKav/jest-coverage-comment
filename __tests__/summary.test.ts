import rewire from 'rewire'
import { expect, test, describe } from '@jest/globals'
import { getSummaryReport } from '../src/summary'

const summary = rewire('../lib/summary')

describe('coverage from summary', () => {
  const getCoverage = summary.__get__('getCoverage')

  test('should extract coverage from summary', () => {
    const coverage = getCoverage({ lines: { pct: 78.57 } })

    expect(coverage.color).toBe('yellow')
    expect(coverage.coverage).toBe(78)
  })

  test('should return default coverage from summary', () => {
    const coverage = getCoverage({})

    expect(coverage.color).toBe('red')
    expect(coverage.coverage).toBe(0)
  })
})

describe('summary o td', () => {
  const lineSumamryToTd = summary.__get__('lineSumamryToTd')

  test('should parse summary to td', () => {
    const line = lineSumamryToTd({ total: 42, covered: 33, pct: 78.57 })
    expect(line).toBe(`78.57% (33/42)`)
  })

  test('should return default sumamry to td', () => {
    const red = lineSumamryToTd(35)
    expect(red).toBe('')
  })
})

describe('parse summary', () => {
  const parseSummary = summary.__get__('parseSummary')

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
    const summary = parseSummary(summaryString)
    expect(summary).toEqual(expect.objectContaining(total))
  })

  test('should return default summary', () => {
    // @ts-ignore
    const { html, coverage, color } = getSummaryReport({})

    expect(html).toBe('')
    expect(coverage).toBe(0)
    expect(color).toBe('red')
  })
})

test('should return right colors', () => {
  const getCoverageColor = summary.__get__('getCoverageColor')

  expect(getCoverageColor(35)).toBe('red')
  expect(getCoverageColor(50)).toBe('orange')
  expect(getCoverageColor(70)).toBe('yellow')
  expect(getCoverageColor(85)).toBe('green')
  expect(getCoverageColor(95)).toBe('brightgreen')
})
