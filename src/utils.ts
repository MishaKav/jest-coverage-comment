import * as core from '@actions/core'
import { existsSync, readFileSync } from 'fs'

export function getPathToFile(pathToFile: string): string | null {
  if (!pathToFile) {
    return null
  }

  // suports absolute path like '/tmp/coverage-final.json'
  return pathToFile.startsWith('/')
    ? pathToFile
    : `${process.env.GITHUB_WORKSPACE}/${pathToFile}`
}

export function getContentFile(pathToFile: string): string | null {
  if (!pathToFile) {
    return null
  }

  const fileExists = existsSync(pathToFile)

  if (!fileExists) {
    core.warning(`File "${pathToFile}" doesn't exist`)
    return null
  }

  const content = readFileSync(pathToFile, 'utf8')

  if (!content) {
    core.warning(`No content found in file "${pathToFile}"`)
    return null
  }

  core.info(`File read successfully "${pathToFile}"`)
  return content
}
