import * as core from '@actions/core'
import { existsSync, readFileSync } from 'fs'

function getPathToFile(pathToFile: string): string {
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
    core.warning(`Path to file was not prvided`)
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
