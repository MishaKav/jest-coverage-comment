import * as core from '@actions/core'
import {
  MAX_FAILED_TESTS,
  failedTestsToMarkdown,
  junitToMarkdown,
  parseJunit,
} from './junit'
import { Options } from './types'
import { getContentFile, notNull, parseLine } from './utils'

/** Return multiple report in markdown format. */
export async function getMultipleJunitReport(
  options: Options
): Promise<string | null> {
  const { multipleJunitFiles } = options

  if (!multipleJunitFiles?.length) {
    return null
  }

  try {
    const lineReports = multipleJunitFiles.map(parseLine).filter(notNull)
    if (!lineReports.length) {
      core.error(
        'Generating report for multiple JUnit files. No files are provided'
      )
      return null
    }

    let atLeastOneFileExists = false
    let table =
      '| Title | Tests | Skipped | Failures | Errors | Time |\n' +
      '| --- | --- | --- | --- | --- | --- |\n'
    let failedBlocks = ''
    // `max-failed-tests` is a total budget across all files
    let remainingFailedTests = options.maxFailedTests || MAX_FAILED_TESTS

    for (const titleFileLine of lineReports) {
      const { title, file } = titleFileLine
      const xmlContent = getContentFile(file)
      const parsedXml = await parseJunit(xmlContent)

      if (parsedXml) {
        const junitHtml = junitToMarkdown(parsedXml, options, true)
        table += `| ${title} ${junitHtml}\n`
        atLeastOneFileExists = true

        if (remainingFailedTests > 0) {
          const failedTestsHtml = failedTestsToMarkdown(
            parsedXml.failedTests ?? [],
            { ...options, maxFailedTests: remainingFailedTests },
            title
          )
          failedBlocks += failedTestsHtml ? `\n\n${failedTestsHtml}` : ''
          remainingFailedTests -= parsedXml.failedTests?.length ?? 0
        }
      }
    }

    if (atLeastOneFileExists) {
      return table + failedBlocks
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(
        `Generating summary report for multiple JUnit files. ${error.message}`
      )
    }
  }

  return null
}
