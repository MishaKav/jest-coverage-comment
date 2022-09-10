import * as core from '@actions/core'
import { expect, test, describe, jest } from '@jest/globals'
import { getMultipleReport, exportedForTesting } from '../src/multi-files'

const { parseLine } = exportedForTesting

describe('parsing one-line', () => {
  test('should not parse bad line', () => {
    const parsedLine1 = parseLine('')
    const parsedLine2 = parseLine('some bad line')
    const parsedLine3 = parseLine(`title only`)
    const parsedLine4 = parseLine(`./path/to/file.json`)

    expect(parsedLine1).toBeNull()
    expect(parsedLine2).toBeNull()
    expect(parsedLine3).toBeNull()
    expect(parsedLine4).toBeNull()
  })

  test('should parse correctly one-line', async () => {
    const parsedLine1 = parseLine(`title1, ./path/to/file.json`)
    const parsedLine2 = parseLine(`title1,./path/to/file.json`)
    const expectedResult = { title: 'title1', file: './path/to/file.json' }

    expect(parsedLine1).toMatchObject(expectedResult)
    expect(parsedLine2).toMatchObject(expectedResult)
  })
})

describe('multi report', () => {
  test('should not parse when no files', () => {
    // @ts-ignore
    const result1 = getMultipleReport({ multipleFiles: [] })
    // @ts-ignore
    const result2 = getMultipleReport({ multipleFiles: [' '] })

    expect(result1).toBeNull()
    expect(result2).toBeNull()
  })

  test('should throw error on bad format', () => {
    const spy = jest.spyOn(core, 'error')
    // @ts-ignore
    const result = getMultipleReport({ multipleFiles: ['./path/to/file.json'] })

    expect(result).toBeNull()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      `Generating summary report for multiple files. No files are provided`
    )
  })

  test('should throw warning when file not exist', () => {
    const spy = jest.spyOn(core, 'warning')
    // @ts-ignore
    const result = getMultipleReport({
      multipleFiles: ['title1, ./path/to/file.json'],
    })

    expect(result).toBeNull()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith(`File "./path/to/file.json" doesn't exist`)
    expect(spy).toHaveBeenCalledWith(`Summary json was not provided`)
  })

  test('should generate markdown for one file', () => {
    const html = `| Title | Lines | Statements | Branches | Functions |
| ----- | ----- | ------- | -------- | -------- |
| title1 | <a href="https://github.com/undefined/blob/undefined/README.md"><img alt="undefined: 78%" src="https://img.shields.io/badge/undefined-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
`
    // @ts-ignore
    const result = getMultipleReport({
      multipleFiles: [
        `title1, ${__dirname}/../data/coverage_1/coverage-summary.json`,
      ],
    })

    expect(result).toBe(html)
  })

  test('should generate markdown for two files', () => {
    const html = `| Title | Lines | Statements | Branches | Functions |
| ----- | ----- | ------- | -------- | -------- |
| title1 | <a href="https://github.com/undefined/blob/undefined/README.md"><img alt="undefined: 78%" src="https://img.shields.io/badge/undefined-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 100% (0/0) | 33.33% (2/6) |
| title2 | <a href="https://github.com/undefined/blob/undefined/README.md"><img alt="undefined: 79%" src="https://img.shields.io/badge/undefined-79%25-yellow.svg" /></a><br/> | 77.27% (34/44) | 100% (0/0) | 33.33% (2/6) |
`
    // @ts-ignore
    const result = getMultipleReport({
      multipleFiles: [
        `title1, ${__dirname}/../data/coverage_1/coverage-summary.json`,
        `title2, ${__dirname}/../data/coverage_1/coverage-summary_2.json`,
      ],
    })

    expect(result).toBe(html)
  })
})
