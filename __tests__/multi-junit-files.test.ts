import * as core from '@actions/core'
import { expect, test, describe, jest } from '@jest/globals'
import { getMultipleJunitReport } from '../src/multi-junit-files'

describe('multi junit report', () => {
  test('should not parse when no files', async () => {
    // @ts-ignore
    const result1 = await getMultipleJunitReport({ multipleJunitFiles: [] })
    // @ts-ignore
    const result2 = await getMultipleJunitReport({ multipleJunitFiles: [' '] })

    expect(result1).toBeNull()
    expect(result2).toBeNull()
  })

  test('should throw error on bad format', async () => {
    const spy = jest.spyOn(core, 'error')
    // @ts-ignore
    const result = await getMultipleJunitReport({
      multipleJunitFiles: ['./path/to/file.xml'],
    })

    expect(result).toBeNull()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      `Generating report for multiple junit files. No files are provided`
    )
  })

  test('should throw warning when file not exist', async () => {
    const spy = jest.spyOn(core, 'warning')
    // @ts-ignore
    const result = await getMultipleJunitReport({
      multipleJunitFiles: ['title1, ./path/to/junit.xml'],
    })

    expect(result).toBeNull()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith(`File "./path/to/junit.xml" doesn't exist`)
    expect(spy).toHaveBeenCalledWith(`Junit xml was not provided`)
  })

  test('should generate markdown for one file', async () => {
    const html = `| Title | Tests | Skipped | Failures | Errors | Time |
| ----- | ----- | ------- | -------- | -------- | ------------------ |
| title1 | 6 | 0 :zzz: | 0 :x: | 0 :fire: | 0.732s :stopwatch: |
`
    // @ts-ignore
    const result = await getMultipleJunitReport({
      multipleJunitFiles: [`title1, ${__dirname}/../data/coverage_1/junit.xml`],
    })

    expect(result).toBe(html)
  })

  test('should generate markdown for two files', async () => {
    const html = `| Title | Tests | Skipped | Failures | Errors | Time |
| ----- | ----- | ------- | -------- | -------- | ------------------ |
| title1 | 6 | 0 :zzz: | 0 :x: | 0 :fire: | 0.732s :stopwatch: |
| title2 | 6 | 0 :zzz: | 0 :x: | 0 :fire: | 0.732s :stopwatch: |
`
    // @ts-ignore
    const result = await getMultipleJunitReport({
      multipleJunitFiles: [
        `title1, ${__dirname}/../data/coverage_1/junit.xml`,
        `title2, ${__dirname}/../data/coverage_1/junit.xml`,
      ],
    })

    expect(result).toBe(html)
  })
})
