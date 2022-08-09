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
    const result = getMultipleReport({ multipleFiles: [] })
    expect(result).toBeNull()
  })

  test('should throw error on bad format', () => {
    // @ts-ignore
    const result = getMultipleReport({ multipleFiles: ['./path/to/file.json'] })
    expect(result).toBeNull()
  })
})
