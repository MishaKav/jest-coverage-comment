import { expect, test, describe } from '@jest/globals'
import {
  parseCoverage,
  getTotalLine,
  isFile,
  isFolder,
  exportedForTesting,
} from '../src/parse-coverage'
import { CoverageLine } from '../src/types'
import { setup } from './setup'

setup()

const {
  parseLine,
  isHeaderLine,
  isTotalLine,
  isFileLine,
  isFolderLine,
  arrToLine,
} = exportedForTesting

describe('check coverage parsing', () => {
  test('should parse string line to array', () => {
    const header =
      'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s'
    const line = 'constants.ts | 0 | 100 | 100 | 0 | 1-3'
    const parsedLine = parseLine(line)
    const headerLine = parseLine(header)

    expect(parsedLine).toEqual(['constants.ts', '0', '100', '100', '0', '1-3'])
    expect(headerLine).toEqual([
      'File',
      'Stmts',
      'Branch',
      'Funcs',
      'Lines',
      'Uncovered Line',
    ])
  })

  test('should check right type for each line', () => {
    expect(isHeaderLine(['File', 'Stmts', 'Lines'])).toBeTruthy()
    expect(isHeaderLine(['100'])).toBeFalsy()

    expect(isTotalLine(['All files'])).toBeTruthy()
    expect(isTotalLine(['100'])).toBeFalsy()

    expect(isFileLine(['some-file.js'])).toBeTruthy()
    expect(isFileLine(['100'])).toBeFalsy()

    expect(isFolderLine(['some-folder'])).toBeTruthy()
    expect(isFolderLine(['some-file.js'])).toBeFalsy()
  })

  test('should find total line', () => {
    const coverageArr = [
      {
        file: 'All files',
        stmts: 70.21,
        branch: 100,
        funcs: 28.57,
        lines: 71.73,
        uncoveredLines: null,
      },
      {
        file: 'src/controller.js',
        stmts: 46.66,
        branch: 100,
        funcs: 33.33,
        lines: 46.66,
        uncoveredLines: ['5-9', '23-27'],
      },
    ]
    const result = getTotalLine(coverageArr)
    expect(result).toMatchObject(coverageArr[0])
  })

  test('should check right type for folder', () => {
    expect(isFolder({ file: 'some-folder' } as never)).toBeTruthy()

    expect(isFolder({ file: 'some-file.js' } as never)).toBeFalsy()
  })

  test('should check right type for file', () => {
    expect(isFile({ file: 'some-folder' } as never)).toBeFalsy()

    expect(isFile({ file: 'some-file.js' } as never)).toBeTruthy()
  })

  test('should return undefined on missing total line', () => {
    const coverageArr = [
      {
        file: 'src/controller.js',
        stmts: 46.66,
        branch: 100,
        funcs: 33.33,
        lines: 46.66,
        uncoveredLines: ['5-9', '23-27'],
      },
    ]
    const result = getTotalLine(coverageArr)
    expect(result).toBeUndefined()
  })

  test('should convert string line to CoverageLine', () => {
    const result = arrToLine([
      'constants.ts',
      '0',
      '12.34',
      '100',
      '99',
      '11-12,19-20',
    ])
    expect(result).toMatchObject({
      file: 'constants.ts',
      stmts: 0,
      branch: 12.34,
      funcs: 100,
      lines: 99,
      uncoveredLines: ['11-12', '19-20'],
    })
  })

  test('should not report uncoveredLines', () => {
    const result = arrToLine(['constants.ts', '0', '12.34', '100', '99', ''])
    expect(result).toHaveProperty('uncoveredLines', null)
  })

  test('should parse coverage.txt to CoverageLine[]', () => {
    const coverageTxt = `----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------|---------|----------|---------|---------|-------------------
All files       |   70.21 |      100 |   28.57 |   71.73 |                   
 src            |   68.29 |      100 |   33.33 |   68.29 |                   
  controller.js |   46.66 |      100 |   33.33 |   46.66 | 5-9,23-27         
  index.js      |   85.71 |      100 |       0 |   85.71 | 9                 
  router.js     |     100 |      100 |     100 |     100 |                   
  service.js    |   69.23 |      100 |      50 |   69.23 | 16-20             
 src/utils      |   83.33 |      100 |       0 |     100 |                   
  config.js     |     100 |      100 |     100 |     100 |                   
  utils.js      |      75 |      100 |       0 |     100 |                   
----------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 76.74% ( 33/43 )
Branches     : 100% ( 0/0 )
Functions    : 33.33% ( 2/6 )
Lines        : 78.57% ( 33/42 )
================================================================================
`
    const result: CoverageLine[] = [
      {
        file: 'All files',
        stmts: 70.21,
        branch: 100,
        funcs: 28.57,
        lines: 71.73,
        uncoveredLines: null,
      },
      {
        file: 'src',
        stmts: 68.29,
        branch: 100,
        funcs: 33.33,
        lines: 68.29,
        uncoveredLines: null,
      },
      {
        file: 'src/controller.js',
        stmts: 46.66,
        branch: 100,
        funcs: 33.33,
        lines: 46.66,
        uncoveredLines: ['5-9', '23-27'],
      },
      {
        file: 'src/index.js',
        stmts: 85.71,
        branch: 100,
        funcs: 0,
        lines: 85.71,
        uncoveredLines: ['9'],
      },
      {
        file: 'src/router.js',
        stmts: 100,
        branch: 100,
        funcs: 100,
        lines: 100,
        uncoveredLines: null,
      },
      {
        file: 'src/service.js',
        stmts: 69.23,
        branch: 100,
        funcs: 50,
        lines: 69.23,
        uncoveredLines: ['16-20'],
      },
      {
        file: 'src/utils',
        stmts: 83.33,
        branch: 100,
        funcs: 0,
        lines: 100,
        uncoveredLines: null,
      },
      {
        file: 'src/utils/config.js',
        stmts: 100,
        branch: 100,
        funcs: 100,
        lines: 100,
        uncoveredLines: null,
      },
      {
        file: 'src/utils/utils.js',
        stmts: 75,
        branch: 100,
        funcs: 0,
        lines: 100,
        uncoveredLines: null,
      },
    ]
    const parsingResult = parseCoverage(coverageTxt)

    for (const [index, line] of parsingResult.entries()) {
      const exceptResult = result[index]
      expect(line.file).toBe(exceptResult.file)
      expect(line.stmts).toBe(exceptResult.stmts)
      expect(line.branch).toBe(exceptResult.branch)
      expect(line.lines).toBe(exceptResult.lines)
      expect(line.uncoveredLines).toEqual(exceptResult.uncoveredLines)
    }
  })
})
