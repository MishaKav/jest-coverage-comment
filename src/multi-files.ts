import * as core from '@actions/core'
import { getCoverage, parseSummary, summaryToMarkdown } from './summary'
import { Options } from './types'
import { getContentFile, parseLine } from './utils'

// return multiple report in markdown format
export function getMultipleReport(options: Options): string | null {
  const { multipleFiles } = options

  if (!multipleFiles?.length) {
    return null
  }

  try {
    const lineReports = multipleFiles.map(parseLine).filter((l) => l)
    if (!lineReports?.length) {
      // prettier-ignore
      core.error(`Generating summary report for multiple files. No files are provided`)
      return null
    }

    let atLeastOneFileExists = false
    let table = `| Title | Lines | Statements | Branches | Functions |
| ----- | ----- | ------- | -------- | -------- |
`

    for (const titleFileLine of lineReports) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { title, file } = titleFileLine!
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
      // prettier-ignore
      core.error(`Generating summary report for multiple files. ${error.message}`)
    }
  }

  return null
}
