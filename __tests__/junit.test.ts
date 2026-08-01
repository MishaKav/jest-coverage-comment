import { expect, test, describe } from '@jest/globals'
import {
  failedTestsToMarkdown,
  getJunitReport,
  parseJunit,
  junitToMarkdown,
} from '../src/junit'
import { FailedTest } from '../src/types.d'
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
})

describe('parsing failed tests', () => {
  test('should collect failed test with message attribute', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="2" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="2"><testcase classname="class A" name="test one" time="0.1"><failure message="expected 1 to be 2" type="Error">stack trace</failure></testcase><testcase classname="class B" name="test two" time="0.1"></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests).toHaveLength(1)
    expect(junit?.failedTests?.[0]).toEqual({
      suiteName: 'suite A',
      classname: 'class A',
      testName: 'test one',
      message: 'expected 1 to be 2',
    })
  })

  test('should collect message from failure body when no attribute', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="1"><testcase classname="class A" name="test one" time="0.1"><failure>Timeout - Async callback was not invoked</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests).toHaveLength(1)
    expect(junit?.failedTests?.[0].message).toBe(
      'Timeout - Async callback was not invoked'
    )
  })

  test('should collect testcase with error node', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="0" errors="1" time="0.5"><testsuite name="suite A" errors="1" failures="0" skipped="0" tests="1"><testcase classname="class A" name="test one" time="0.1"><error message="TypeError: boom" type="TypeError">stack</error></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests).toHaveLength(1)
    expect(junit?.failedTests?.[0].message).toBe('TypeError: boom')
  })

  test('should not collect skipped and passed testcases', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="2" failures="0" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="0" skipped="1" tests="2"><testcase classname="class A" name="test one" time="0.1"><skipped/></testcase><testcase classname="class B" name="test two" time="0.1"></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests).toEqual([])
  })

  test('should return empty failed tests when no testcases', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="6" failures="5" errors="4" time="0.732"></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests).toEqual([])
  })
})

describe('failed tests to markdown', () => {
  const failedTest: FailedTest = {
    suiteName: 'suite A',
    classname: 'class A',
    testName: 'test one',
    message: 'expected 1 to be 2',
  }

  test('should return empty string when no failed tests', () => {
    expect(failedTestsToMarkdown([])).toBe('')
  })

  test('should render collapsed table with failed tests', () => {
    const failedTests: FailedTest[] = [
      failedTest,
      {
        suiteName: 'suite B',
        classname: 'class B',
        testName: 'test two',
        message: 'Timeout - Async callback was not invoked',
      },
    ]
    const html = failedTestsToMarkdown(failedTests)

    expect(html).toBe(
      '<details><summary>:x: Failed Tests (<b>2</b>)</summary><table><tr><th>Test</th><th>Failure Message</th></tr><tr><td>test one</td><td>expected 1 to be 2</td></tr><tr><td>test two</td><td>Timeout - Async callback was not invoked</td></tr></table></details>'
    )
  })

  test('should render title in summary', () => {
    const html = failedTestsToMarkdown([failedTest], 'My Title')

    expect(html).toContain(':x: Failed Tests — My Title (<b>1</b>)')
  })

  test('should escape html and collapse multiline messages', () => {
    const html = failedTestsToMarkdown([
      {
        suiteName: 'suite A',
        classname: 'class A',
        testName: 'test <b>one</b> & two',
        message: 'expected <a> & "b"\n\nreceived | `c`',
      },
    ])

    expect(html).toContain(
      '<td>test &lt;b&gt;one&lt;/b&gt; &amp; two</td><td>expected &lt;a&gt; &amp; "b" · received | `c`</td>'
    )
  })

  test('should truncate long messages', () => {
    const html = failedTestsToMarkdown([
      { ...failedTest, message: 'a'.repeat(400) },
    ])

    expect(html).toContain(`<td>${'a'.repeat(300)}…</td>`)
    expect(html).not.toContain('a'.repeat(301))
  })

  test('should cap number of rendered failed tests', () => {
    const failedTests: FailedTest[] = Array.from({ length: 35 }, (_, i) => ({
      ...failedTest,
      testName: `test ${i + 1}`,
    }))
    const html = failedTestsToMarkdown(failedTests)

    expect(html).toContain(':x: Failed Tests (<b>35</b>)')
    expect(html).toContain('test 30')
    expect(html).not.toContain('test 31')
    expect(html).toContain('...and 5 more failed tests')
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

  test('should return failed tests report when show-failed-tests enabled', async () => {
    const optionsWithFailures = {
      ...options,
      junitFile: `${__dirname}/../data/coverage_1/junit_with_failures.xml`,
      showFailedTests: true,
    }
    const junit = await getJunitReport(optionsWithFailures)
    const { junitHtml, failedTestsHtml, skipped, errors, failures, tests } =
      junit

    expect(skipped).toBe(1)
    expect(errors).toBe(1)
    expect(failures).toBe(2)
    expect(tests).toBe(6)
    expect(junitHtml).not.toContain('<details>')
    expect(failedTestsHtml).toContain(
      '<details><summary>:x: Failed Tests (<b>3</b>)</summary>'
    )
    expect(failedTestsHtml).toContain(
      'should test controller when #getPost method method fails'
    )
    expect(failedTestsHtml).toContain(
      'should test Service when #list method fails'
    )
    expect(failedTestsHtml).toContain(
      'should test router should test get posts'
    )
    expect(failedTestsHtml).toContain(
      'Expected: "Hello" · Received: "Hi" &amp; &lt;b&gt;`bold`&lt;/b&gt; | pipe'
    )
  })

  test('should not return failed tests report when show-failed-tests disabled', async () => {
    const optionsWithFailures = {
      ...options,
      junitFile: `${__dirname}/../data/coverage_1/junit_with_failures.xml`,
    }
    const { failedTestsHtml } = await getJunitReport(optionsWithFailures)

    expect(failedTestsHtml).toBe('')
  })

  test('should not return failed tests report when no failures', async () => {
    const optionsWithFlag = { ...options, showFailedTests: true }
    const { junitHtml, failedTestsHtml } = await getJunitReport(optionsWithFlag)

    expect(failedTestsHtml).toBe('')
    expect(junitHtml).not.toContain('<details>')
  })

  test('should return empty failed tests report on default report', async () => {
    const { failedTestsHtml } = await getJunitReport({} as never)

    expect(failedTestsHtml).toBe('')
  })
})
