import { expect, test, describe } from '@jest/globals'
import { getMultipleJunitReport } from '../src/multi-junit-files'
import { setup, spyCore } from './setup'

setup()

describe('multi junit report', () => {
  test('should not parse when no files', async () => {
    const result1 = await getMultipleJunitReport({
      multipleJunitFiles: [],
    } as never)
    const result2 = await getMultipleJunitReport({
      multipleJunitFiles: [' '],
    } as never)

    expect(result1).toBeNull()
    expect(result2).toBeNull()
  })

  test('should throw error on bad format', async () => {
    const result = await getMultipleJunitReport({
      multipleJunitFiles: ['./path/to/file.xml'],
    } as never)

    expect(result).toBeNull()
    expect(spyCore.error).toHaveBeenCalledTimes(1)
    expect(spyCore.error).toHaveBeenCalledWith(
      'Generating report for multiple JUnit files. No files are provided'
    )
  })

  test('should throw warning when file not exist', async () => {
    const result = await getMultipleJunitReport({
      multipleJunitFiles: ['title1, ./path/to/junit.xml'],
    } as never)

    expect(result).toBeNull()
    expect(spyCore.warning).toHaveBeenCalledTimes(2)
    expect(spyCore.warning).toHaveBeenCalledWith(
      `File "./path/to/junit.xml" doesn't exist`
    )
    expect(spyCore.warning).toHaveBeenCalledWith('JUnit XML was not provided')
  })

  test('should generate markdown for one file', async () => {
    const result = await getMultipleJunitReport({
      multipleJunitFiles: [`title1, ${__dirname}/../data/coverage_1/junit.xml`],
    } as never)

    expect(result).toMatchInlineSnapshot(`
      "| Title | Tests | Skipped | Failures | Errors | Time |
      | --- | --- | --- | --- | --- | --- |
      | title1 | 6 | 0 :zzz: | 0 :x: | 0 :fire: | 0.732s :stopwatch: |
      "
    `)
  })

  test('should generate markdown for two files', async () => {
    const result = await getMultipleJunitReport({
      multipleJunitFiles: [
        `title1, ${__dirname}/../data/coverage_1/junit.xml`,
        `title2, ${__dirname}/../data/coverage_1/junit.xml`,
      ],
    } as never)

    expect(result).toMatchInlineSnapshot(`
      "| Title | Tests | Skipped | Failures | Errors | Time |
      | --- | --- | --- | --- | --- | --- |
      | title1 | 6 | 0 :zzz: | 0 :x: | 0 :fire: | 0.732s :stopwatch: |
      | title2 | 6 | 0 :zzz: | 0 :x: | 0 :fire: | 0.732s :stopwatch: |
      "
    `)
  })
})
