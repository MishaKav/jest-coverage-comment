import * as core from '@actions/core'
import { existsSync, readFileSync } from 'fs'
import { CoverageColor } from './types'

export function getPathToFile(pathToFile: string): string {
  if (!pathToFile) {
    return ''
  }

  // suports absolute path like '/tmp/coverage-summary.json'
  return pathToFile.startsWith('/')
    ? pathToFile
    : `${process.env.GITHUB_WORKSPACE}/${pathToFile}`
}

export function getContentFile(pathToFile: string): string {
  if (!pathToFile) {
    core.warning(`Path to file was not provided`)
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

// get coverage color from percentage
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
