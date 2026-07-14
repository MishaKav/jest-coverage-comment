import { expect, test, describe } from '@jest/globals'
import { getPatchCoverage } from '../src/patch-coverage'
import { parsePatchAddedLines } from '../src/changed-files'
import { Options } from '../src/types'

const lcovFixture = `${__dirname}/../data/patch/lcov.info`

function baseOptions(overrides: Partial<Options> = {}): Options {
  return {
    token: 'token_123',
    repository: 'postman-eng/example',
    serverUrl: 'https://github.com',
    commit: 'deadbeef',
    watermark: '',
    prefix: '',
    coveragePathPrefix: '',
    badgeTitle: 'Net Coverage',
    summaryFile: '',
    netCoverageMain: '0',
    coverageLcovFile: lcovFixture,
    ...overrides,
  }
}

describe('parsePatchAddedLines', () => {
  test('captures only added/modified head-side lines', () => {
    const patch = [
      '@@ -1,3 +1,4 @@',
      ' context',
      '+added1',
      '+added2',
      ' tail',
    ].join('\n')
    // header newStart=1: line1 context, line2 +, line3 +, line4 context
    expect(parsePatchAddedLines(patch)).toEqual([2, 3])
  })

  test('deletions do not advance the head cursor', () => {
    const patch = ['@@ -1,3 +1,2 @@', ' keep', '-removed', '+replacement'].join(
      '\n'
    )
    // line1 keep, removed does not advance, line2 +replacement
    expect(parsePatchAddedLines(patch)).toEqual([2])
  })

  test('handles multiple hunks', () => {
    const patch = [
      '@@ -1,1 +1,2 @@',
      ' a',
      '+b',
      '@@ -10,1 +11,2 @@',
      ' c',
      '+d',
    ].join('\n')
    expect(parsePatchAddedLines(patch)).toEqual([2, 12])
  })

  test('ignores the no-newline-at-eof marker', () => {
    const patch = [
      '@@ -1,1 +1,1 @@',
      '+only',
      '\\ No newline at end of file',
    ].join('\n')
    expect(parsePatchAddedLines(patch)).toEqual([1])
  })
})

describe('getPatchCoverage', () => {
  test('computes coverage over changed executable lines only', () => {
    const options = baseOptions({
      changedFiles: {
        all: ['src/covered.js'],
        // line 4 is not executable (absent from lcov) and must be ignored
        changedLines: { 'src/covered.js': [1, 2, 3, 4] },
      },
    })

    const patch = getPatchCoverage(options)
    expect(patch).not.toBeNull()
    expect(patch?.totalLines).toBe(3)
    expect(patch?.coveredLines).toBe(2)
    expect(patch?.coverage).toBe(66.67)
    expect(patch?.files[0].uncoveredLines).toEqual([3])
    expect(patch?.files[0].instrumented).toBe(true)
  })

  test('counts a new untested source file as fully uncovered (strict)', () => {
    const options = baseOptions({
      changedFiles: {
        all: ['src/new-feature.ts'],
        changedLines: { 'src/new-feature.ts': [1, 2, 3] },
      },
    })

    const patch = getPatchCoverage(options)
    expect(patch?.coverage).toBe(0)
    expect(patch?.totalLines).toBe(3)
    expect(patch?.files[0].instrumented).toBe(false)
  })

  test('ignores non-source changed files with no coverage data', () => {
    const options = baseOptions({
      changedFiles: {
        all: ['README.md', 'docs/config.yml'],
        changedLines: { 'README.md': [1, 2], 'docs/config.yml': [3] },
      },
    })

    const patch = getPatchCoverage(options)
    // Nothing coverable changed => 100% (gate passes), no files listed.
    expect(patch?.totalLines).toBe(0)
    expect(patch?.coverage).toBe(100)
    expect(patch?.files).toHaveLength(0)
  })

  test('resolves pass/fail against the configured threshold', () => {
    const failing = getPatchCoverage(
      baseOptions({
        patchThreshold: '80',
        changedFiles: {
          all: ['src/covered.js'],
          changedLines: { 'src/covered.js': [1, 2, 3] },
        },
      })
    )
    expect(failing?.threshold).toBe(80)
    expect(failing?.meetsThreshold).toBe(false)

    const passing = getPatchCoverage(
      baseOptions({
        patchThreshold: '50',
        changedFiles: {
          all: ['src/covered.js'],
          changedLines: { 'src/covered.js': [1, 2, 3] },
        },
      })
    )
    expect(passing?.meetsThreshold).toBe(true)
  })

  test('is advisory (no threshold) when patchThreshold is unset', () => {
    const patch = getPatchCoverage(
      baseOptions({
        changedFiles: {
          all: ['src/covered.js'],
          changedLines: { 'src/covered.js': [1, 2, 3] },
        },
      })
    )
    expect(patch?.threshold).toBeNull()
    expect(patch?.meetsThreshold).toBeNull()
  })

  test('returns null when no line-level coverage source is provided', () => {
    const options = baseOptions({ coverageLcovFile: '' })
    options.changedFiles = {
      all: ['src/covered.js'],
      changedLines: { 'src/covered.js': [1] },
    }
    expect(getPatchCoverage(options)).toBeNull()
  })
})
