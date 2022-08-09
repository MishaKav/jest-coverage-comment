import * as core from '@actions/core'
import { getCoverage, parseSummary, summaryToMarkdown } from './summary'
import { Options } from './types'
import { getContentFile } from './utils'

// return multiple report in markdown format
export function getMultipleReport(options: Options): string | null {
  const { multipleFiles } = options

  if (!multipleFiles?.length) {
    return null
  }

  try {
    let atLeastOneFileExists = false
    let table = `| Lines | Statements | Branches | Functions |
| ----- | ------- | -------- | -------- |
`

    for (const file of multipleFiles) {
      const jsonContent = getContentFile(file)
      const summary = parseSummary(jsonContent)

      if (summary) {
        const { color, coverage } = getCoverage(summary)
        const contentMd = summaryToMarkdown(summary, options, true)
        table += `${contentMd}\n`

        atLeastOneFileExists = true
        core.startGroup(file)
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
