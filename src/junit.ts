/* eslint-disable  @typescript-eslint/no-explicit-any */
import * as core from '@actions/core'
import * as xml2js from 'xml2js'
import { FailedTest, Junit, JunitReport, Options } from './types.d'
import { getContentFile, getFileUrl } from './utils'

const MAX_FAILURE_MESSAGE_LENGTH = 500
const MAX_FAILURE_MESSAGE_LINES = 15
const MAX_REASON_LENGTH = 120
const MAX_TEST_NAME_LENGTH = 255
export const MAX_FAILED_TESTS = 30
const ABSOLUTE_PATH_REGEX = /^(\/|[A-Za-z]:\/)/
// guard memory on huge failure outputs, rendering truncates far below this
const MAX_STORED_MESSAGE_LENGTH = 10000
const STACK_FRAME_REGEX = /^\s+at\s/
const TEST_FILE_REGEX = /(__tests__\/|\.(test|spec)\.[cm]?[jt]sx?$)/

/** Escape characters that are unsafe inside generated html. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Extract texts from <failure> or <error> node.
 * xml2js parses a node without attributes to a plain string,
 * otherwise to `{ $: { message }, _: 'body text' }` (both parts optional).
 */
function getNodeTexts(node: any): string[] {
  if (typeof node === 'string') {
    return [node.trim()]
  }

  return [node?.$?.message, node?._?.trim()].filter(Boolean)
}

/** Truncate text with ellipsis when it exceeds the given length. */
function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

/** Extract message from <failure> or <error> node, the most detailed text wins. */
function getFailureMessage(node: any): string {
  return getNodeTexts(node).reduce(
    (longest: string, text: string) =>
      text.length > longest.length ? text : longest,
    ''
  )
}

/** Strip stack-trace frames and generic `Error:` prefix from failure message, cap length and number of lines. */
function formatFailureMessage(message: string): string {
  const withoutStack = message
    .split(/\r?\n/)
    .filter((line) => !STACK_FRAME_REGEX.test(line))
    .map((line) => line.trimEnd())
    .join('\n')

  let text = truncateText(
    withoutStack.trim().replace(/^Error:\s*/, ''),
    MAX_FAILURE_MESSAGE_LENGTH
  )

  const lines = text.split('\n')
  if (lines.length > MAX_FAILURE_MESSAGE_LINES) {
    text = `${lines.slice(0, MAX_FAILURE_MESSAGE_LINES).join('\n')}\n…`
  }

  return text
}

/**
 * Extract short one-line reason from failure message:
 * the `Expected/Received` pair, the first changed diff pair,
 * or the first meaningful line.
 */
function extractShortReason(message: string): string {
  const lines = message
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' ').replace(/,$/, ''))
    .filter(Boolean)

  const expected = lines.find((line) => line.startsWith('Expected: '))
  const received = lines.find((line) => line.startsWith('Received: '))
  const removed = lines.find(
    (line) => line.startsWith('- ') && !line.startsWith('- Expected')
  )
  const added = lines.find(
    (line) => line.startsWith('+ ') && !line.startsWith('+ Received')
  )

  let reason = ''
  if (expected && received) {
    reason = `${expected} · ${received}`
  } else if (removed && added) {
    reason = `${removed} · ${added}`
  } else {
    const firstLine =
      lines.find((line) => !line.startsWith('expect(')) ?? lines[0] ?? ''
    reason = firstLine.startsWith('thrown: ')
      ? firstLine.replace(/^thrown: "?/, '').replace(/"$/, '')
      : firstLine
  }

  return truncateText(reason, MAX_REASON_LENGTH)
}

/**
 * Wrap failure message in a fenced `diff` code block, so jest
 * `- Expected` / `+ Received` lines get red/green highlighting.
 * The fence is extended when the message itself contains backtick runs.
 */
function messageToDiffBlock(message: string): string {
  const backtickRuns = message.match(/`+/g) ?? []
  const longestRun = Math.max(0, ...backtickRuns.map((run) => run.length))
  const fence = '`'.repeat(Math.max(3, longestRun + 1))

  return `${fence}diff\n${message}\n${fence}`
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
  const frames: { file: string; line: number }[] = []

  for (const rawText of rawTexts) {
    for (const textLine of rawText.split(/\r?\n/)) {
      if (
        !STACK_FRAME_REGEX.test(textLine) ||
        textLine.includes('node_modules')
      ) {
        continue
      }

      const match = textLine.match(/\(?([^()\s]+):(\d+):(\d+)\)?$/)
      if (match) {
        frames.push({ file: match[1], line: Number(match[2]) })
      }
    }
  }

  // a failure can be thrown inside an app helper, prefer the test file frame
  const testFrame = frames.find((frame) => TEST_FILE_REGEX.test(frame.file))
  if (testFrame) {
    return testFrame
  }

  if (tc.$?.file) {
    return { file: tc.$.file }
  }

  return frames[0] ?? {}
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

            return {
              suiteName: t.$?.name ?? '',
              testName: tc.$?.name ?? '',
              message: nodes
                .map(getFailureMessage)
                .filter(Boolean)
                .join('\n')
                .slice(0, MAX_STORED_MESSAGE_LENGTH),
              ...getTestLocation(tc, nodes.flatMap(getNodeTexts)),
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

/**
 * Make test name html for the summary line.
 * The suite name carries the link to the test file (when known),
 * the rest of the test name stays plain text.
 */
function toTestName(test: FailedTest, options: Options): string {
  const { repository, commit, prefix = '', removeLinksToFiles } = options
  const { suiteName, testName } = test
  const hasSuitePrefix =
    Boolean(suiteName) &&
    testName.startsWith(suiteName) &&
    testName !== suiteName
  const mainText = truncateText(
    hasSuitePrefix ? suiteName : testName,
    MAX_TEST_NAME_LENGTH
  )
  const restText = hasSuitePrefix
    ? ` › ${escapeHtml(
        truncateText(
          testName.slice(suiteName.length).trim(),
          MAX_TEST_NAME_LENGTH
        )
      )}`
    : ''

  const testFile = test.file?.replace(/\\/g, '/')
  const isAbsolutePath = Boolean(testFile && ABSOLUTE_PATH_REGEX.test(testFile))
  // absolute stack-trace paths are repo-relative after removing the
  // workspace prefix, `coverage-path-prefix` applies only to relative ones
  const relative =
    testFile && isAbsolutePath && prefix
      ? testFile.replace(prefix.replace(/\\/g, '/'), '')
      : testFile
  const cannotResolvePath =
    !relative || (isAbsolutePath && ABSOLUTE_PATH_REGEX.test(relative))

  if (!repository || !commit || removeLinksToFiles || cannotResolvePath) {
    return `<b>${escapeHtml(mainText)}</b>${restText}`
  }

  const urlOptions = isAbsolutePath
    ? { ...options, coveragePathPrefix: '' }
    : options
  const anchor = test.line ? `#L${test.line}` : ''
  const href = escapeHtml(getFileUrl(urlOptions, relative, anchor)).replace(
    /"/g,
    '&quot;'
  )

  return `<a href="${href}">${escapeHtml(mainText)}</a>${restText}`
}

/** Convert failed tests to collapsed html table. */
export function failedTestsToMarkdown(
  failedTests: FailedTest[],
  options: Options,
  title?: string
): string {
  if (!options.showFailedTests || !failedTests.length) {
    return ''
  }

  const maxFailedTests = options.maxFailedTests || MAX_FAILED_TESTS
  const summaryTitle = title ? `Failed Tests — ${title}` : 'Failed Tests'
  const entries = failedTests.slice(0, maxFailedTests).map((test) => {
    const message = formatFailureMessage(test.message)
    const reason = extractShortReason(message)

    return `<details><summary>${toTestName(test, options)} — <code>${escapeHtml(
      reason
    )}</code></summary>\n\n${messageToDiffBlock(message)}\n\n</details>`
  })

  if (failedTests.length > maxFailedTests) {
    entries.push(
      `_...and ${failedTests.length - maxFailedTests} more failed tests_`
    )
  }

  return `<details><summary>:x: ${escapeHtml(summaryTitle)} (<b>${
    failedTests.length
  }</b>)</summary>\n\n${entries.join('\n')}\n\n</details>`
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
        const failedTestsHtml = failedTestsToMarkdown(
          failedTests ?? [],
          options
        )

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
