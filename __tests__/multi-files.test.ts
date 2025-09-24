import { expect, test, describe } from '@jest/globals'
import { getMultipleReport } from '../src/multi-files'
import { spyCore } from './setup'

describe('multi report', () => {
  test('should not parse when no files', () => {
    const result1 = getMultipleReport({ multipleFiles: [] } as never)
    const result2 = getMultipleReport({ multipleFiles: [' '] } as never)

    expect(result1).toBeNull()
    expect(result2).toBeNull()
  })

  test('should throw error on bad format', () => {
    const result = getMultipleReport({
      multipleFiles: ['./path/to/file.json'],
    } as never)

    expect(result).toBeNull()
    expect(spyCore.error).toHaveBeenCalledTimes(1)
    expect(spyCore.error).toHaveBeenCalledWith(
      'Generating summary report for multiple files. No files are provided'
    )
  })

  test('should throw warning when file not exist', () => {
    const result = getMultipleReport({
      multipleFiles: ['title1, ./path/to/file.json'],
    } as never)

    expect(result).toBeNull()
    expect(spyCore.warning).toHaveBeenCalledTimes(2)
    expect(spyCore.warning).toHaveBeenCalledWith(
      'File "./path/to/file.json" doesn\'t exist'
    )
    expect(spyCore.warning).toHaveBeenCalledWith(
      'Summary JSON was not provided'
    )
  })

  test('should generate markdown for one file', () => {
    const result = getMultipleReport({
      multipleFiles: [
        `title1, ${__dirname}/../data/coverage_1/coverage-summary.json`,
      ],
    } as never)

    expect(result).toMatchInlineSnapshot(`
      "| Title | Lines | Statements | Branches | Functions |
      | --- | --- | --- | --- | --- |
      | title1 | <a href="https://github.com/undefined/blob/undefined/README.md"><img alt="undefined: 78%" src="https://img.shields.io/badge/undefined-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
      "
    `)
  })

  test('should generate markdown for two files', () => {
    const result = getMultipleReport({
      multipleFiles: [
        `title1, ${__dirname}/../data/coverage_1/coverage-summary.json`,
        `title2, ${__dirname}/../data/coverage_1/coverage-summary_2.json`,
      ],
    } as never)

    expect(result).toMatchInlineSnapshot(`
      "| Title | Lines | Statements | Branches | Functions |
      | --- | --- | --- | --- | --- |
      | title1 | <a href="https://github.com/undefined/blob/undefined/README.md"><img alt="undefined: 78%" src="https://img.shields.io/badge/undefined-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
      | title2 | <a href="https://github.com/undefined/blob/undefined/README.md"><img alt="undefined: 79%" src="https://img.shields.io/badge/undefined-79%25-yellow.svg" /></a><br/> | 77.27% (34/44) | 100% (0/0) | 33.33% (2/6) |
      "
    `)
  })

  test('should return multiple files report with text instead of badges', () => {
    const result = getMultipleReport({
      multipleFiles: [
        `title1, ${__dirname}/../data/coverage_1/coverage-summary.json`,
        `title2, ${__dirname}/../data/coverage_1/coverage-summary_2.json`,
      ],
      textInsteadBadge: true,
    } as never)

    expect(result).toMatchInlineSnapshot(`
      "| Title | Lines | Statements | Branches | Functions |
      | --- | --- | --- | --- | --- |
      | title1 | 78.57% (33/42) | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
      | title2 | 79.06% (34/43) | 77.27% (34/44) | 100% (0/0) | 33.33% (2/6) |
      "
    `)
  })
})
