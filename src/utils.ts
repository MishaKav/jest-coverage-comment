import * as core from '@actions/core'
import { existsSync, readFileSync } from 'fs'
import { CoverageColor, MultipleFilesLine } from './types'

export function getPathToFile(pathToFile: string): string {
  if (!pathToFile) {
    return ''
  }

  // Supports absolute path like '/tmp/coverage-summary.json'
  return pathToFile.startsWith('/')
    ? pathToFile
    : `${process.env.GITHUB_WORKSPACE}/${pathToFile}`
}

export function getContentFile(pathToFile: string): string {
  if (!pathToFile) {
    core.warning('Path to file was not provided')
    return ''
  }

  const fixedFilePath = getPathToFile(pathToFile)
  const fileExists = existsSync(fixedFilePath)

  if (!fileExists) {
    core.warning(`File "${pathToFile}" doesn't exist`)
    return ''
  }

  const content = readFileSync(fixedFilePath, 'utf8')

  if (!content) {
    core.warning(`No content found in file "${pathToFile}"`)
    return ''
  }

  core.info(`File read successfully "${pathToFile}"`)
  return content
}

/** Get coverage color from percentage. */
export function getCoverageColor(percentage: number): CoverageColor {
  // https://shields.io/category/coverage
  const rangeColors: { color: CoverageColor; range: [number, number] }[] = [
    {
      color: 'red',
      range: [0, 40],
    },
    {
      color: 'orange',
      range: [40, 60],
    },
    {
      color: 'yellow',
      range: [60, 80],
    },
    {
      color: 'green',
      range: [80, 90],
    },
    {
      color: 'brightgreen',
      range: [90, 101],
    },
  ]

  const { color } =
    rangeColors.find(
      ({ range: [min, max] }) => percentage >= min && percentage < max
    ) || rangeColors[0]

  return color
}

/** Parse one-line from multiple files to object. */
export const parseLine = (line: string): MultipleFilesLine | null => {
  if (!line.includes(',')) {
    return null
  }

  const lineArr = line.split(',')
  return {
    title: lineArr[0].trim(),
    file: lineArr[1].trim(),
    previousCoverage: lineArr[2],
  }
}

/** Helper function to filter null entries out of an array. */
export function notNull<T>(value: T | null | undefined): value is T {
  return value !== null
}
