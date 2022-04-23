/* eslint-disable  @typescript-eslint/no-explicit-any */
import * as core from '@actions/core'
import * as xml2js from 'xml2js'
import { Junit, JunitReport, Options } from './types.d'
import { getContentFile } from './utils'

// parse junit.xml to Junit object
async function parseJunit(xmlContent: string): Promise<Junit | null> {
  try {
    if (!xmlContent) {
      core.warning(`Junit xml was not prvided`)
      return null
    }

    const parser = new xml2js.Parser()
    const parsedJunit = await parser.parseStringPromise(xmlContent)

    if (!parsedJunit) {
      core.warning(`Junit xml file is not XML or not well formed`)
      return null
    }

    const main = parsedJunit.testsuites['$']
    const testsuites = parsedJunit.testsuites.testsuite
    const skipped =
      testsuites
        ?.map((t: any) => Number(t['$'].skipped))
        .reduce((sum: number, a: number) => sum + a, 0) || 0

    return {
      skipped,
      errors: Number(main.errors),
      failures: Number(main.failures),
      tests: Number(main.tests),
      time: Number(main.time),
    } as Junit
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Parse junit report. ${error.message}`)
    }
  }

  return null
}

// convert junit from junitxml to md
function junitToMarkdown(junit: Junit, options: Options): string {
  const { skipped, errors, failures, tests, time } = junit
  const displayTime =
    time > 60 ? `${(time / 60) | 0}m ${time % 60 | 0}s` : `${time}s`

  const table = `| Tests | Skipped | Failures | Errors | Time |
| ----- | ------- | -------- | -------- | ------------------ |
| ${tests} | ${skipped} :zzz: | ${failures} :x: | ${errors} :fire: | ${displayTime} :stopwatch: |
`

  if (options.junitTitle) {
    return `## ${options.junitTitle}

${table}`
  }

  return table
}

// return junit report
export async function getJunitReport(options: Options): Promise<JunitReport> {
  const { junitFile } = options

  try {
    if (junitFile) {
      const xmlContent = getContentFile(junitFile)
      const parsedXml = await parseJunit(xmlContent)

      if (parsedXml) {
        const junitHtml = junitToMarkdown(parsedXml, options)
        const { skipped, errors, failures, tests, time } = parsedXml

        return {
          junitHtml,
          tests,
          skipped,
          failures,
          errors,
          time,
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Error on generating junit report. ${error.message}`)
    }
  }

  return {
    junitHtml: '',
    tests: 0,
    skipped: 0,
    failures: 0,
    errors: 0,
    time: 0,
  }
}

export const exportedForTesting = {
  parseJunit,
  junitToMarkdown,
}
