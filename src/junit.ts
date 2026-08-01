/* eslint-disable  @typescript-eslint/no-explicit-any */
import * as core from '@actions/core'
import * as xml2js from 'xml2js'
import { FailedTest, Junit, JunitReport, Options } from './types.d'
import { getContentFile } from './utils'

const MAX_FAILURE_MESSAGE_LENGTH = 500
const MAX_FAILURE_MESSAGE_LINES = 15
const MAX_FAILED_TESTS = 30

/** Escape characters that are unsafe inside generated html. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Extract message from <failure> or <error> node.
 * xml2js parses a node without attributes to a plain string,
 * otherwise to `{ $: { message }, _: 'body text' }` (both parts optional).
 */
function getFailureMessage(node: any): string {
  if (typeof node === 'string') {
    return node.trim()
  }

  return node?.$?.message ?? node?._?.trim() ?? ''
}

/** Strip stack-trace frames from failure message, cap length and number of lines. */
function formatFailureMessage(message: string): string {
  const withoutStack = message
    .split(/\r?\n/)
    .filter((line) => !/^\s+at\s/.test(line))
    .map((line) => line.trimEnd())
    .join('\n')

  let text = withoutStack.trim()

  if (text.length > MAX_FAILURE_MESSAGE_LENGTH) {
    text = `${text.slice(0, MAX_FAILURE_MESSAGE_LENGTH)}…`
  }

  const lines = text.split('\n')
  if (lines.length > MAX_FAILURE_MESSAGE_LINES) {
    text = `${lines.slice(0, MAX_FAILURE_MESSAGE_LINES).join('\n')}\n…`
  }

  return text
}

/** Convert multiline failure message to html for a table cell. */
function messageToHtml(message: string): string {
  return escapeHtml(message)
    .split('\n')
    .map((line) => line.replace(/^ +| {2,}/g, (m) => '&nbsp;'.repeat(m.length)))
    .join('<br/>')
}

/**
 * Extract test file location from the first own stack-trace frame
 * in the failure text (has the line number), falling back to the
 * `file` attribute of jest-junit `addFileAttribute` option.
 */
function getTestLocation(
  tc: any,
  rawTexts: string[]
): { file?: string; line?: number } {
  for (const rawText of rawTexts) {
    for (const textLine of rawText.split(/\r?\n/)) {
      if (!/^\s+at\s/.test(textLine) || textLine.includes('node_modules')) {
        continue
      }

      const match = textLine.match(/\(?([^()\s]+):(\d+):(\d+)\)?$/)
      if (match) {
        return { file: match[1], line: Number(match[2]) }
      }
    }
  }

  if (tc.$?.file) {
    return { file: tc.$.file }
  }

  return {}
}

/** Parse junit.xml to Junit object */
export async function parseJunit(xmlContent: string): Promise<Junit | null> {
  try {
    if (!xmlContent) {
      core.warning('JUnit XML was not provided')
      return null
    }

    const parser = new xml2js.Parser()
    const parsedJunit = await parser.parseStringPromise(xmlContent)

    if (!parsedJunit) {
      core.warning('JUnit XML file is not XML or not well formed')
      return null
    }

    /**
     * <testsuites> Usually the root element of a JUnit XML file. Some tools leave out
     * the <testsuites> element if there is only a single top-level <testsuite> element (which
     * is then used as the root element).
     */
    const main = parsedJunit.testsuites?.$ ?? parsedJunit.testsuite?.$
    const testsuites = parsedJunit.testsuites?.testsuite
      ? parsedJunit.testsuites?.testsuite
      : parsedJunit.testsuite
        ? [parsedJunit.testsuite]
        : null

    const errors =
      testsuites
        ?.map((t: any) => Number(t['$'].errors))
        .reduce((sum: number, a: number) => sum + a, 0) || 0

    const skipped =
      testsuites
        ?.map((t: any) => Number(t['$'].skipped))
        .reduce((sum: number, a: number) => sum + a, 0) || 0

    const failedTests: FailedTest[] =
      testsuites?.flatMap((t: any) =>
        (t.testcase ?? [])
          .filter((tc: any) => tc.failure || tc.error)
          .map((tc: any) => {
            const nodes = [...(tc.failure ?? []), ...(tc.error ?? [])]
            const rawTexts = nodes
              .flatMap((node: any) =>
                typeof node === 'string' ? [node] : [node?.$?.message, node?._]
              )
              .filter(Boolean)

            return {
              suiteName: t.$?.name ?? '',
              classname: tc.$?.classname ?? '',
              testName: tc.$?.name ?? '',
              message: nodes.map(getFailureMessage).filter(Boolean).join('\n'),
              ...getTestLocation(tc, rawTexts),
            }
          })
      ) ?? []

    return {
      skipped,
      errors: Number(main.errors || errors),
      failures: Number(main.failures),
      tests: Number(main.tests),
      time: Number(main.time),
      failedTests,
    } as Junit
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Parse JUnit report. ${error.message}`)
    }
  }

  return null
}

/** Convert JUnit from JUnit XML to md. */
export function junitToMarkdown(
  junit: Junit,
  options: Options,
  withoutHeader = false
): string {
  const { skipped, errors, failures, tests, time } = junit
  const displayTime =
    time > 60 ? `${(time / 60) | 0}m ${(time % 60) | 0}s` : `${time}s`

  const tableHeader = `| Tests | Skipped | Failures | Errors | Time |
| ----- | ------- | -------- | -------- | ------------------ |`
  const content = `| ${tests} | ${skipped} :zzz: | ${failures} :x: | ${errors} :fire: | ${displayTime} :stopwatch: |`
  const table = `${tableHeader}
${content}
`

  if (withoutHeader) {
    return content
  }

  if (options.junitTitle) {
    return `## ${options.junitTitle}

${table}`
  }

  return table
}

/** Make test name cell - td, with link to the test file when known. */
function toTestNameTd(test: FailedTest, options: Options): string {
  const {
    serverUrl = 'https://github.com',
    repository,
    commit,
    prefix = '',
    coveragePathPrefix = '',
  } = options
  const name = `<code>${escapeHtml(test.testName)}</code>`

  if (!test.file || !repository || !commit) {
    return `<td>${name}</td>`
  }

  const relative = prefix ? test.file.replace(prefix, '') : test.file
  const anchor = test.line ? `#L${test.line}` : ''
  const href = `${serverUrl}/${repository}/blob/${commit}/${coveragePathPrefix}${relative}${anchor}`

  return `<td><a href="${href}">${name}</a></td>`
}

/** Convert failed tests to collapsed html table. */
export function failedTestsToMarkdown(
  failedTests: FailedTest[],
  options: Options,
  title?: string
): string {
  if (!failedTests.length) {
    return ''
  }

  const summaryTitle = title ? `Failed Tests — ${title}` : 'Failed Tests'
  const rows = failedTests
    .slice(0, MAX_FAILED_TESTS)
    .map(
      (test) =>
        `<tr>${toTestNameTd(test, options)}<td><code>${messageToHtml(
          formatFailureMessage(test.message)
        )}</code></td></tr>`
    )

  if (failedTests.length > MAX_FAILED_TESTS) {
    rows.push(
      `<tr><td colspan="2">...and ${
        failedTests.length - MAX_FAILED_TESTS
      } more failed tests</td></tr>`
    )
  }

  return `<details><summary>:x: ${escapeHtml(summaryTitle)} (<b>${
    failedTests.length
  }</b>)</summary><table><tr><th>Test</th><th>Failure Message</th></tr>${rows.join(
    ''
  )}</table></details>`
}

/** Return JUnit report. */
export async function getJunitReport(options: Options): Promise<JunitReport> {
  const { junitFile } = options

  try {
    if (junitFile) {
      const xmlContent = getContentFile(junitFile)
      const parsedXml = await parseJunit(xmlContent)

      if (parsedXml) {
        const junitHtml = junitToMarkdown(parsedXml, options)
        const { skipped, errors, failures, tests, time, failedTests } =
          parsedXml
        const failedTestsHtml =
          options.showFailedTests && failedTests?.length
            ? failedTestsToMarkdown(failedTests, options)
            : ''

        return {
          junitHtml,
          failedTestsHtml,
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
      core.error(`Error on generating JUnit report. ${error.message}`)
    }
  }

  return {
    junitHtml: '',
    failedTestsHtml: '',
    tests: 0,
    skipped: 0,
    failures: 0,
    errors: 0,
    time: 0,
  }
}
