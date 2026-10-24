import { readFileSync } from 'fs'
import { expect, test, describe, beforeAll, afterAll } from '@jest/globals'
import {
  encodePath,
  escapeHtml,
  escapeHtmlAttr,
  getContentFile,
  getCoverageColor,
  getPathToFile,
  hasParentSegment,
  parseLine,
} from '../src/utils'
import { spyCore } from './setup'

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
      const content = getContentFile('')

      expect(content).toEqual('')
      expect(spyCore.warning).toHaveBeenCalledTimes(1)
      expect(spyCore.warning).toHaveBeenCalledWith(
        'Path to file was not provided'
      )
    })

    test('should return empty string on non exist file', () => {
      const content = getContentFile('non-exist-file.json')

      expect(content).toEqual('')
      expect(spyCore.warning).toHaveBeenCalledTimes(1)
      expect(spyCore.warning).toHaveBeenCalledWith(
        `File "non-exist-file.json" doesn't exist`
      )
    })

    test('should return empty content on empty file', () => {
      const pathToFile = '__mocks__/empty.json'
      const content = getContentFile(pathToFile)

      expect(spyCore.warning).toHaveBeenCalledTimes(1)
      expect(content).toEqual('')
      expect(spyCore.warning).toHaveBeenCalledWith(
        `No content found in file "${pathToFile}"`
      )
    })

    test('should return empty content on empty file', () => {
      const pathToFile = '__mocks__/empty.json'
      const content = getContentFile(pathToFile)

      expect(spyCore.warning).toHaveBeenCalledTimes(1)
      expect(content).toEqual('')
      expect(spyCore.warning).toHaveBeenCalledWith(
        `No content found in file "${pathToFile}"`
      )
    })

    test('should return full content on file', () => {
      const pathToFile = '__mocks__/coverage.txt'
      const originalContent = readFileSync(
        `${GITHUB_WORKSPACE}/${pathToFile}`,
        'utf8'
      )
      const content = getContentFile(pathToFile)

      expect(spyCore.info).toHaveBeenCalledTimes(1)
      expect(content).toEqual(originalContent)
      expect(spyCore.info).toHaveBeenCalledWith(
        `File read successfully "${pathToFile}"`
      )
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

  describe('html escaping and path helpers', () => {
    test('should escape html special characters', () => {
      expect(escapeHtml('<b>a & b</b>')).toBe('&lt;b&gt;a &amp; b&lt;/b&gt;')
      expect(escapeHtml('&amp;')).toBe('&amp;amp;')
      expect(escapeHtml('say "hi"')).toBe('say "hi"')
    })

    test('should also escape double quotes in attribute values', () => {
      expect(escapeHtmlAttr('x" onclick="y')).toBe('x&quot; onclick=&quot;y')
      expect(escapeHtmlAttr('<a&b>')).toBe('&lt;a&amp;b&gt;')
    })

    test('should encode each path segment and keep separators', () => {
      expect(encodePath('src/my file#1?.ts')).toBe('src/my%20file%231%3F.ts')
      expect(encodePath('src/100%/ünï.ts')).toBe('src/100%25/%C3%BCn%C3%AF.ts')
      expect(encodePath('src/utils/config.js')).toBe('src/utils/config.js')
    })

    test('should encode a lone surrogate instead of throwing', () => {
      expect(encodePath('src/\ud800.ts')).toBe('src/%EF%BF%BD.ts')
    })

    test('should detect a parent directory segment', () => {
      expect(hasParentSegment('../src/a.ts')).toBe(true)
      expect(hasParentSegment('src/../../a.ts')).toBe(true)
      expect(hasParentSegment('src/..')).toBe(true)
      expect(hasParentSegment('src/..a/b..ts')).toBe(false)
      expect(hasParentSegment('src/a.ts')).toBe(false)
    })
  })
})
