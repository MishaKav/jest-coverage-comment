import { expect, test, describe } from '@jest/globals'
import {
  fixCoverageFilePaths,
  exportedForTesting,
} from '../src/fix-coverage-paths'
import { parseCoverage } from '../src/parse-coverage'
import { getContentFile } from '../src/utils'
import { Options } from '../src/types'
import { spyCore } from './setup'

const { parentDir, getPathCandidates, matchCandidate, restorePaths } =
  exportedForTesting

const WORKSPACE = '/home/runner/work/my-repo/my-repo/'

const options: Options = {
  token: 'token_123',
  repository: 'MishaKav/jest-coverage-comment',
  serverUrl: 'https://github.com',
  commit: '05953710b21d222efa4f4535424a7af367be5a57',
  watermark: '<!-- Jest Coverage Comment: 1 -->\n',
  summaryTitle: '',
  prefix: WORKSPACE,
  coveragePathPrefix: '',
  badgeTitle: 'Coverage',
  coverageTitle: 'Coverage Report',
  coverageFile: `${__dirname}/../data/coverage_2/coverage.txt`,
  summaryFile: `${__dirname}/../data/coverage_2/coverage-summary.json`,
}

// `jest --changedSince` run where covered files span two subfolders:
// istanbul strips the common parent 'src/clients' from the text report
const partialContent = getContentFile(
  `${__dirname}/../data/coverage_2/coverage.txt`
)

// `jest --changedSince` run where all covered files live in one folder:
// istanbul strips the whole 'src/clients/abc' prefix
const flatContent = getContentFile(
  `${__dirname}/../data/coverage_3/coverage.txt`
)

describe('fix coverage paths', () => {
  test('should get parent directory', () => {
    expect(parentDir('src/clients/abc/responses.ts')).toBe('src/clients/abc')
    expect(parentDir('abc/responses.ts')).toBe('abc')
    expect(parentDir('responses.ts')).toBe('')
  })

  test('should get path candidates from summary json', () => {
    const jsonContent = `{
      "total": {},
      "${WORKSPACE}src/clients/abc/responses.ts": {},
      "/foreign/root/src/clients/abc/client.ts": {}
    }`
    const candidates = getPathCandidates(jsonContent, WORKSPACE)

    expect(candidates).toEqual(['src/clients/abc/responses.ts'])
  })

  test('should get path candidates when prefix misses trailing slash', () => {
    const jsonContent = `{
      "total": {},
      "${WORKSPACE}src/clients/abc/responses.ts": {}
    }`
    const candidates = getPathCandidates(jsonContent, WORKSPACE.slice(0, -1))

    expect(candidates).toEqual(['src/clients/abc/responses.ts'])
  })

  test('should return no candidates on empty content or prefix', () => {
    expect(getPathCandidates('', WORKSPACE)).toEqual([])
    expect(getPathCandidates('{"total": {}}', '')).toEqual([])
  })

  test('should return no candidates on invalid json', () => {
    expect(getPathCandidates('{invalid', WORKSPACE)).toEqual([])
    expect(spyCore.warning).toHaveBeenCalledTimes(1)
  })

  test('should match unique candidate by suffix', () => {
    const candidates = [
      'src/clients/abc/responses.ts',
      'src/clients/def/helpers.ts',
    ]

    expect(matchCandidate('responses.ts', candidates)).toBe(
      'src/clients/abc/responses.ts'
    )
    expect(matchCandidate('abc/responses.ts', candidates)).toBe(
      'src/clients/abc/responses.ts'
    )
  })

  test('should not match already correct, ambiguous or unknown paths', () => {
    // already correct
    expect(
      matchCandidate('src/clients/abc/responses.ts', [
        'src/clients/abc/responses.ts',
      ])
    ).toBeNull()
    // ambiguous
    expect(
      matchCandidate('index.ts', ['src/a/index.ts', 'src/b/index.ts'])
    ).toBeNull()
    // segment boundary: 'xabc/a.ts' should not match 'abc/a.ts'
    expect(matchCandidate('abc/a.ts', ['src/xabc/a.ts'])).toBeNull()
    // unknown
    expect(matchCandidate('unknown.ts', ['src/a/index.ts'])).toBeNull()
  })

  test('should restore paths on flat report', () => {
    const coverageArr = parseCoverage(flatContent)
    const result = restorePaths(coverageArr, ['src/clients/abc/responses.ts'])

    expect(result.map((l) => l.file)).toEqual([
      'All files',
      'src/clients/abc/responses.ts',
    ])
    // input should not be mutated
    expect(coverageArr.map((l) => l.file)).toEqual([
      'All files',
      'responses.ts',
    ])
  })

  test('should restore paths and folders on partial report', () => {
    const coverageArr = parseCoverage(partialContent)
    const result = restorePaths(coverageArr, [
      'src/clients/abc/client.ts',
      'src/clients/abc/responses.ts',
      'src/clients/def/helpers.ts',
    ])

    expect(result.map((l) => l.file)).toEqual([
      'All files',
      'src/clients/abc',
      'src/clients/abc/client.ts',
      'src/clients/abc/responses.ts',
      'src/clients/def',
      'src/clients/def/helpers.ts',
    ])
  })

  test('should fix paths through the summary file', () => {
    const coverageArr = parseCoverage(partialContent)
    const result = fixCoverageFilePaths(coverageArr, options)

    expect(result.map((l) => l.file)).toEqual([
      'All files',
      'src/clients/abc',
      'src/clients/abc/client.ts',
      'src/clients/abc/responses.ts',
      'src/clients/def',
      'src/clients/def/helpers.ts',
    ])
    expect(spyCore.info).toHaveBeenCalledWith(
      `Restored 5 coverage path(s) from '${options.summaryFile}'`
    )
  })

  test('should fix paths when all covered files share one folder', () => {
    const coverageArr = parseCoverage(flatContent)
    const result = fixCoverageFilePaths(coverageArr, {
      ...options,
      coverageFile: `${__dirname}/../data/coverage_3/coverage.txt`,
      summaryFile: `${__dirname}/../data/coverage_3/coverage-summary.json`,
    })

    expect(result.map((l) => l.file)).toEqual([
      'All files',
      'src/clients/abc/responses.ts',
    ])
  })

  test('should warn on paths that cannot be restored', () => {
    const coverageArr = parseCoverage(flatContent)
    // both summary files end with 'responses.ts', so the match is ambiguous
    const result = fixCoverageFilePaths(coverageArr, {
      ...options,
      summaryFile: `${__dirname}/../data/coverage_3/coverage-summary_2.json`,
    })

    expect(result.map((l) => l.file)).toEqual(['All files', 'responses.ts'])
    expect(spyCore.warning).toHaveBeenCalledWith(
      'Could not restore coverage path(s): responses.ts'
    )
  })

  test('should keep paths when coverage-path-prefix is provided', () => {
    const coverageArr = parseCoverage(partialContent)
    const result = fixCoverageFilePaths(coverageArr, {
      ...options,
      coveragePathPrefix: 'src/',
    })

    expect(result).toBe(coverageArr)
  })

  test('should keep paths when prefix or summary file are not available', () => {
    const coverageArr = parseCoverage(partialContent)

    expect(fixCoverageFilePaths(coverageArr, { ...options, prefix: '' })).toBe(
      coverageArr
    )
    expect(
      fixCoverageFilePaths(coverageArr, { ...options, summaryFile: '' })
    ).toBe(coverageArr)
    expect(
      fixCoverageFilePaths(coverageArr, {
        ...options,
        summaryFile: `${__dirname}/../data/coverage_2/not-exists.json`,
      })
    ).toBe(coverageArr)
  })

  test('should keep paths when summary file cannot be read', () => {
    const coverageArr = parseCoverage(partialContent)
    // a directory passes the existsSync check, but reading it throws
    const result = fixCoverageFilePaths(coverageArr, {
      ...options,
      summaryFile: `${__dirname}/../data/coverage_2`,
    })

    expect(result).toBe(coverageArr)
  })

  test('should keep already correct report untouched', () => {
    const coverageArr = parseCoverage(partialContent)
    const fixedArr = fixCoverageFilePaths(coverageArr, options)
    const result = fixCoverageFilePaths(fixedArr, options)

    expect(result).toEqual(fixedArr)
  })
})
