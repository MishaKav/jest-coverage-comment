import * as core from '@actions/core'
import { readFileSync } from 'fs'
import {
  expect,
  test,
  describe,
  jest,
  beforeAll,
  afterAll,
} from '@jest/globals'
import {
  getContentFile,
  getCoverageColor,
  getPathToFile,
  parseLine,
} from '../src/utils'

describe('should check all utils functions', () => {
  const GITHUB_WORKSPACE = process.cwd()
  const ORIGINAL_GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE

  beforeAll(() => {
    process.env.GITHUB_WORKSPACE = GITHUB_WORKSPACE
  })

  afterAll(() => {
    process.env.GITHUB_WORKSPACE = ORIGINAL_GITHUB_WORKSPACE
  })

  describe('should check getPathToFile', () => {
    test('should return empty string on empty path', () => {
      const pathToFile = getPathToFile('')
      expect(pathToFile).toBe('')
    })

    test('should return absolute path', () => {
      const pathToFile = getPathToFile('/tmp/file.js')
      expect(pathToFile).toBe('/tmp/file.js')
    })

    test('should return path with GITHUB_WORKSPACE', () => {
      const pathToFile = getPathToFile('myfolder/file.js')
      expect(pathToFile).toBe(`${GITHUB_WORKSPACE}/myfolder/file.js`)
    })
  })

  describe('should check getContentFile', () => {
    test('should return empty string', () => {
      const spy = jest.spyOn(core, 'warning')
      const content = getContentFile('')

      expect(content).toEqual('')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('Path to file was not provided')
    })

    test('should return empty string on non exist file', () => {
      const spy = jest.spyOn(core, 'warning')
      const content = getContentFile('non-exist-file.json')

      expect(content).toEqual('')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(
        `File "non-exist-file.json" doesn't exist`
      )
    })

    test('should return empty content on empty file', () => {
      const spy = jest.spyOn(core, 'warning')
      const pathToFile = '__mocks__/empty.json'
      const content = getContentFile(pathToFile)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(content).toEqual('')
      expect(spy).toHaveBeenCalledWith(
        `No content found in file "${pathToFile}"`
      )
    })

    test('should return empty content on empty file', () => {
      const spy = jest.spyOn(core, 'warning')
      const pathToFile = '__mocks__/empty.json'
      const content = getContentFile(pathToFile)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(content).toEqual('')
      expect(spy).toHaveBeenCalledWith(
        `No content found in file "${pathToFile}"`
      )
    })

    test('should return full content on file', () => {
      const spy = jest.spyOn(core, 'info')
      const pathToFile = '__mocks__/coverage.txt'
      const originalContent = readFileSync(
        `${GITHUB_WORKSPACE}/${pathToFile}`,
        'utf8'
      )
      const content = getContentFile(pathToFile)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(content).toEqual(originalContent)
      expect(spy).toHaveBeenCalledWith(`File read successfully "${pathToFile}"`)
    })
  })

  describe('should check colors', () => {
    test('should return right colors', () => {
      expect(getCoverageColor(35)).toBe('red')
      expect(getCoverageColor(50)).toBe('orange')
      expect(getCoverageColor(70)).toBe('yellow')
      expect(getCoverageColor(85)).toBe('green')
      expect(getCoverageColor(95)).toBe('brightgreen')
    })

    test('should return default color', () => {
      expect(getCoverageColor(-1)).toBe('red')
    })
  })

  describe('parsing one-line', () => {
    test('should not parse bad line', () => {
      const parsedLine1 = parseLine('')
      const parsedLine2 = parseLine('some bad line')
      const parsedLine3 = parseLine('title only')
      const parsedLine4 = parseLine('./path/to/file.json')

      expect(parsedLine1).toBeNull()
      expect(parsedLine2).toBeNull()
      expect(parsedLine3).toBeNull()
      expect(parsedLine4).toBeNull()
    })

    test('should parse correctly one-line', async () => {
      const parsedLine1 = parseLine('title1, ./path/to/file.json')
      const parsedLine2 = parseLine('title1,./path/to/file.json')
      const expectedResult = { title: 'title1', file: './path/to/file.json' }

      expect(parsedLine1).toMatchObject(expectedResult)
      expect(parsedLine2).toMatchObject(expectedResult)
    })
  })
})
