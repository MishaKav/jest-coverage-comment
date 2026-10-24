import * as core from '@actions/core'
import { existsSync, readFileSync } from 'fs'
import { CoverageColor, MultipleFilesLine, Options } from './types'

/** Build URL to a file in the repository at the reported commit. */
export function getFileUrl(
  options: Options,
  relativePath: string,
  anchor = ''
): string {
  const { serverUrl = 'https://github.com', repository, commit } = options

  return `${serverUrl}/${repository}/blob/${commit}/${relativePath}${anchor}`
}

/** Escape characters that are unsafe inside generated html. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Escape a value placed inside a double-quoted html attribute. */
export function escapeHtmlAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;')
}

/** A plain non-negative number, e.g. `78.57`. */
export function isPlainNumber(text: string): boolean {
  return /^\d+(\.\d+)?$/.test(text)
}

/** Replace line breaks with a space, e.g. to keep a value on one line. */
export function stripLineBreaks(text: string): string {
  return text.replace(/[\r\n]+/g, ' ')
}

/**
 * Escape a value for a markdown table cell: line breaks become spaces, ascii
 * punctuation is backslash-escaped (no markdown, `|`, autolinks) and `&<>`
 * become entities. A plain number stays as is.
 */
export function escapeMarkdown(value: string | number): string {
  const text = String(value)

  if (isPlainNumber(text)) {
    return text
  }

  return escapeHtml(
    stripLineBreaks(text).replace(/[!-%'-/:;=?@[-`{-~]/g, '\\$&')
  )
}

/** A unix (`/home/...`) or windows (`C:/...`) absolute path, with `/` separators. */
export const ABSOLUTE_PATH_REGEX = /^(\/|[A-Za-z]:\/)/

/**
 * Encode url-reserved characters in each path segment, keep `/` separators.
 * (toWellFormed: a lone utf-16 surrogate makes encodeURIComponent throw)
 */
export function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment.toWellFormed()))
    .join('/')
}

/** A `..` segment would let a link leave the repo once the browser resolves it. */
export function hasParentSegment(path: string): boolean {
  return path.split('/').includes('..')
}

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
  return { title: lineArr[0].trim(), file: lineArr[1].trim() }
}

/** Helper function to filter null entries out of an array. */
export function notNull<T>(value: T | null | undefined): value is T {
  return value !== null
}
