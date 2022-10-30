import * as core from '@actions/core'
import { getCoverage, parseSummary, summaryToMarkdown } from './summary'
import { Options } from './types'
import { getContentFile, notNull, parseLine } from './utils'

/** Return multiple report in markdown format. */
export function getMultipleReport(options: Options): string | null {
  const { multipleFiles } = options

  if (!multipleFiles?.length) {
    return null
  }

  try {
    const lineReports = multipleFiles.map(parseLine).filter(notNull)
    if (!lineReports.length) {
      core.error(
        'Generating summary report for multiple files. No files are provided'
      )
      return null
    }

    let atLeastOneFileExists = false
    let table =
      '| Title | Lines | Statements | Branches | Functions |\n' +
      '| --- | --- | --- | --- | --- |\n'

    for (const titleFileLine of lineReports) {
      const { title, file } = titleFileLine
      const jsonContent = getContentFile(file)
      const summary = parseSummary(jsonContent)

      if (summary) {
        const { color, coverage } = getCoverage(summary)
        const contentMd = summaryToMarkdown(summary, options, true)
        table += `| ${title} ${contentMd}\n`

        atLeastOneFileExists = true
        core.startGroup(title)
        core.info(`coverage: ${coverage}`)
        core.info(`color: ${color}`)
        core.endGroup()
      }
    }

    if (atLeastOneFileExists) {
      return table
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(
        `Generating summary report for multiple files. ${error.message}`
      )
    }
  }

  return null
}
