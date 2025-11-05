import { expect, test, describe } from '@jest/globals'
import { getJunitReport, parseJunit, junitToMarkdown } from '../src/junit'
import { spyCore } from './setup'

describe('parsing junit', () => {
  test('should parse xml string to junit', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="6" failures="5" errors="4" time="0.732"></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.skipped).toBe(0)
    expect(junit?.errors).toBe(4)
    expect(junit?.failures).toBe(5)
    expect(junit?.tests).toBe(6)
    expect(junit?.time).toBe(0.732)
  })

  test('should count skipped testsuites', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites name="jest tests"><testsuite skipped="3"></testsuite><testsuite skipped="2"></testsuite><testsuite skipped="1"></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.skipped).toBe(6)
  })

  test('should return null when no content', async () => {
    const junit = await parseJunit(null as never)

    expect(junit).toBeNull()
    expect(spyCore.warning).toHaveBeenCalledTimes(1)
    expect(spyCore.warning).toHaveBeenCalledWith('JUnit XML was not provided')
  })

  test('should return null on not well formed files', async () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?>'
    const junit = await parseJunit(xml)

    expect(junit).toBeNull()
    expect(spyCore.warning).toHaveBeenCalledTimes(1)
    expect(spyCore.warning).toHaveBeenCalledWith(
      'JUnit XML file is not XML or not well formed'
    )
  })

  test('should throw error on non XML files', async () => {
    const junit = await parseJunit('bad content')

    expect(junit).toBeNull()
    expect(spyCore.error).toHaveBeenCalledTimes(1)
    expect(spyCore.error).toHaveBeenCalledWith(
      'Parse JUnit report. Non-whitespace before first tag.\nLine: 0\nColumn: 1\nChar: b'
    )
  })

  test('should work with omitted parent testsuites element', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuite name="should test controller" errors="0" failures="0" skipped="0" timestamp="2022-03-21T21:15:26" time="0.981" tests="2"><testcase classname="should test controller when #getPost method method succeeds" name="should test controller when #getPost method method succeeds" time="0.004"></testcase><testcase classname="should test controller when #getPost method method fails" name="should test controller when #getPost method method fails" time="0.001"></testcase></testsuite>'
    const junit = await parseJunit(xml)

    expect(junit?.skipped).toBe(0)
    expect(junit?.errors).toBe(0)
    expect(junit?.failures).toBe(0)
    expect(junit?.tests).toBe(2)
    expect(junit?.time).toBe(0.981)
  })

  test('should extract failed test details', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="3" failures="2" errors="0" time="0.5"><testsuite name="test suite" errors="0" failures="2" skipped="0" time="0.5" tests="3"><testcase classname="MyClass" name="test that passes" time="0.1"></testcase><testcase classname="MyClass" name="test that fails" time="0.2"><failure message="Expected true to be false" type="AssertionError">Error message here</failure></testcase><testcase classname="MyClass" name="another failed test" time="0.2"><failure message="Expected 1 to be 2">Full error stack trace</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failures).toBe(2)
    expect(junit?.failedTests).toHaveLength(2)
    expect(junit?.failedTests?.[0].name).toBe('test that fails')
    expect(junit?.failedTests?.[0].classname).toBe('MyClass')
    expect(junit?.failedTests?.[0].message).toBe('Expected true to be false')
    expect(junit?.failedTests?.[0].type).toBe('AssertionError')
    expect(junit?.failedTests?.[1].name).toBe('another failed test')
    expect(junit?.failedTests?.[1].message).toBe('Expected 1 to be 2')
  })

  test('should extract error test details', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="2" failures="0" errors="1" time="0.3"><testsuite name="test suite" errors="1" failures="0" skipped="0" time="0.3" tests="2"><testcase classname="MyClass" name="test that passes" time="0.1"></testcase><testcase classname="MyClass" name="test with error" time="0.2"><error message="Unexpected error occurred" type="RuntimeError">Error stack trace</error></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.errors).toBe(1)
    expect(junit?.failedTests).toHaveLength(1)
    expect(junit?.failedTests?.[0].name).toBe('test with error')
    expect(junit?.failedTests?.[0].message).toBe('Unexpected error occurred')
    expect(junit?.failedTests?.[0].type).toBe('RuntimeError')
  })

  test('should not include failedTests when no failures', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="2" failures="0" errors="0" time="0.2"><testsuite name="test suite" errors="0" failures="0" skipped="0" time="0.2" tests="2"><testcase classname="MyClass" name="test 1" time="0.1"></testcase><testcase classname="MyClass" name="test 2" time="0.1"></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failures).toBe(0)
    expect(junit?.errors).toBe(0)
    expect(junit?.failedTests).toBeUndefined()
  })
})

describe('parse junit and check report output', () => {
  const options = {
    token: 'token_123',
    repository: 'MishaKav/jest-coverage-comment',
    serverUrl: 'https://github.com',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: '<!-- Jest Coverage Comment: 1 -->\n',
    summaryTitle: '',
    prefix: '',
    badgeTitle: 'Coverage',
    summaryFile: `${__dirname}/../data/coverage_1/coverage-summary.json`,
    junitFile: `${__dirname}/../data/coverage_1/junit.xml`,
  }

  test('should return junit report', async () => {
    const html = `| Tests | Skipped | Failures | Errors | Time |
| ----- | ------- | -------- | -------- | ------------------ |
| 6 | 0 :zzz: | 0 :x: | 0 :fire: | 0.732s :stopwatch: |
`

    const junit = await getJunitReport(options)
    const { junitHtml, skipped, errors, failures, tests, time } = junit

    expect(junitHtml).toEqual(html)
    expect(skipped).toBe(0)
    expect(errors).toBe(0)
    expect(failures).toBe(0)
    expect(tests).toBe(6)
    expect(time).toBe(0.732)
  })

  test('should render junit title', async () => {
    const optionsWithTitle = { ...options, junitTitle: 'junitTitle' }
    const { junitHtml } = await getJunitReport(optionsWithTitle)

    expect(junitHtml).toContain(`## ${optionsWithTitle.summaryTitle}`)
  })

  test('should return default report', async () => {
    const junit = await getJunitReport({} as never)
    const { junitHtml, skipped, errors, failures, tests, time } = junit

    expect(junitHtml).toBe('')
    expect(skipped).toBe(0)
    expect(errors).toBe(0)
    expect(failures).toBe(0)
    expect(tests).toBe(0)
    expect(time).toBe(0)
  })

  test('should convert time from seconds to minutes', async () => {
    const html = `| Tests | Skipped | Failures | Errors | Time |
| ----- | ------- | -------- | -------- | ------------------ |
| 6 | 0 :zzz: | 0 :x: | 0 :fire: | 9m 15s :stopwatch: |
`

    const junit = await getJunitReport(options)
    junit.time = 555.0532
    const markdown = junitToMarkdown(junit, options)
    expect(markdown).toEqual(html)
  })

  test('should show failed tests table when enabled', async () => {
    const optionsWithFailedTests = { ...options, showFailedTests: true }
    const junit = {
      tests: 3,
      skipped: 0,
      failures: 2,
      errors: 0,
      time: 0.5,
      failedTests: [
        {
          name: 'test that fails',
          classname: 'MyClass',
          message: 'Expected true to be false',
          type: 'AssertionError',
        },
        {
          name: 'another failed test',
          classname: 'MyClass',
          message: 'Expected 1 to be 2',
          type: 'failure',
        },
      ],
    }

    const markdown = junitToMarkdown(junit, optionsWithFailedTests)
    expect(markdown).toContain('### Failed Tests')
    expect(markdown).toContain('| Test Name | Message |')
    expect(markdown).toContain(
      '| test that fails | Expected true to be false |'
    )
    expect(markdown).toContain('| another failed test | Expected 1 to be 2 |')
  })

  test('should not show failed tests table when disabled', async () => {
    const optionsWithoutFailedTests = { ...options, showFailedTests: false }
    const junit = {
      tests: 3,
      skipped: 0,
      failures: 2,
      errors: 0,
      time: 0.5,
      failedTests: [
        {
          name: 'test that fails',
          classname: 'MyClass',
          message: 'Expected true to be false',
          type: 'AssertionError',
        },
      ],
    }

    const markdown = junitToMarkdown(junit, optionsWithoutFailedTests)
    expect(markdown).not.toContain('### Failed Tests')
    expect(markdown).not.toContain('test that fails')
  })

  test('should not show failed tests table when no failures', async () => {
    const optionsWithFailedTests = { ...options, showFailedTests: true }
    const junit = {
      tests: 2,
      skipped: 0,
      failures: 0,
      errors: 0,
      time: 0.2,
    }

    const markdown = junitToMarkdown(junit, optionsWithFailedTests)
    expect(markdown).not.toContain('### Failed Tests')
  })

  test('should truncate long error messages', async () => {
    const optionsWithFailedTests = { ...options, showFailedTests: true }
    const longMessage =
      'This is a very long error message that should be truncated to keep the table readable and not overflow the width of the comment'
    const junit = {
      tests: 1,
      skipped: 0,
      failures: 1,
      errors: 0,
      time: 0.1,
      failedTests: [
        {
          name: 'test with long message',
          classname: 'MyClass',
          message: longMessage,
          type: 'AssertionError',
        },
      ],
    }

    const markdown = junitToMarkdown(junit, optionsWithFailedTests)
    expect(markdown).toContain('### Failed Tests')
    expect(markdown).not.toContain(longMessage) // Full message should not appear
    expect(markdown).toContain(longMessage.substring(0, 100)) // Truncated version should appear
  })

  test('should handle multiline error messages', async () => {
    const optionsWithFailedTests = { ...options, showFailedTests: true }
    const multilineMessage = 'First line of error\nSecond line\nThird line'
    const junit = {
      tests: 1,
      skipped: 0,
      failures: 1,
      errors: 0,
      time: 0.1,
      failedTests: [
        {
          name: 'test with multiline message',
          classname: 'MyClass',
          message: multilineMessage,
          type: 'AssertionError',
        },
      ],
    }

    const markdown = junitToMarkdown(junit, optionsWithFailedTests)
    expect(markdown).toContain('First line of error')
    expect(markdown).not.toContain('Second line') // Only first line should appear
  })
})
