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

  test('should keep detailed body text when message attribute is short', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="1"><testcase classname="class A" name="test one" time="0.1"><failure message="assertion failed">assertion failed\ndetailed diff line 1\ndetailed diff line 2</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests?.[0].message).toBe(
      'assertion failed\ndetailed diff line 1\ndetailed diff line 2'
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

  test('should take test location from file attribute', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="1"><testcase classname="class A" name="test one" file="__tests__/failing/service.test.js" time="0.1"><failure>boom</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests?.[0].file).toBe(
      '__tests__/failing/service.test.js'
    )
    expect(junit?.failedTests?.[0].line).toBeUndefined()
  })

  test('should prefer stack-trace location over file attribute', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="1"><testcase classname="class A" name="test one" file="__tests__/other.test.js" time="0.1"><failure>TypeError: boom\n    at Promise.then.completed (/repo/node_modules/jest-circus/build/utils.js:333:28)\n    at Object.toEqual (/repo/__tests__/failing/service.test.js:25:22)\n    at processTicksAndRejections (node:internal/process/task_queues:103:5)</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests?.[0].file).toBe(
      '/repo/__tests__/failing/service.test.js'
    )
    expect(junit?.failedTests?.[0].line).toBe(25)
  })

  test('should prefer test file frame over app helper frames', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="1"><testcase classname="class A" name="test one" time="0.1"><failure>boom\n    at assertPost (/repo/src/helpers/assertions.js:10:5)\n    at Object.toEqual (/repo/__tests__/failing/service.test.js:25:22)</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests?.[0].file).toBe(
      '/repo/__tests__/failing/service.test.js'
    )
    expect(junit?.failedTests?.[0].line).toBe(25)
  })

  test('should prefer file attribute over non test-file frames', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="1"><testcase classname="class A" name="test one" file="__tests__/failing/service.test.js" time="0.1"><failure>boom\n    at assertPost (/repo/src/helpers/assertions.js:10:5)</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests?.[0].file).toBe(
      '__tests__/failing/service.test.js'
    )
    expect(junit?.failedTests?.[0].line).toBeUndefined()
  })

  test('should not have test location when no file info', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><testsuites tests="1" failures="1" errors="0" time="0.5"><testsuite name="suite A" errors="0" failures="1" skipped="0" tests="1"><testcase classname="class A" name="test one" time="0.1"><failure message="boom">no stack here</failure></testcase></testsuite></testsuites>'
    const junit = await parseJunit(xml)

    expect(junit?.failedTests?.[0].file).toBeUndefined()
    expect(junit?.failedTests?.[0].line).toBeUndefined()
  })
})

describe('failed tests to markdown', () => {
  const options = { showFailedTests: true } as never
  const optionsWithRepo = {
    showFailedTests: true,
    serverUrl: 'https://github.com',
    repository: 'MishaKav/jest-coverage-comment',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    prefix: '/home/runner/work/repo/repo/',
  } as never
  const failedTest: FailedTest = {
    suiteName: 'suite A',
    testName: 'test one',
    message: 'expected 1 to be 2',
  }

  test('should return empty string when no failed tests', () => {
    expect(failedTestsToMarkdown([], options)).toBe('')
  })

  test('should return empty string when show-failed-tests is disabled', () => {
    expect(failedTestsToMarkdown([failedTest], {} as never)).toBe('')
  })

  test('should render collapsed section with failed tests', () => {
    const failedTests: FailedTest[] = [
      failedTest,
      {
        suiteName: 'suite B',
        testName: 'test two',
        message: 'Timeout - Async callback was not invoked',
      },
    ]
    const html = failedTestsToMarkdown(failedTests, options)

    expect(html).toBe(
      '<details><summary>:x: Failed Tests (<b>2</b>)</summary>\n\n' +
        '<details><summary><b>test one</b> — <code>expected 1 to be 2</code></summary>\n\n' +
        '```diff\nexpected 1 to be 2\n```\n\n</details>\n' +
        '<details><summary><b>test two</b> — <code>Timeout - Async callback was not invoked</code></summary>\n\n' +
        '```diff\nTimeout - Async callback was not invoked\n```\n\n</details>\n\n' +
        '</details>'
    )
  })

  test('should render title in summary', () => {
    const html = failedTestsToMarkdown([failedTest], options, 'My Title')

    expect(html).toContain(':x: Failed Tests — My Title (<b>1</b>)')
  })

  test('should escape html in test names and reason, keep messages verbatim', () => {
    const html = failedTestsToMarkdown(
      [
        {
          suiteName: 'suite A',
          testName: 'test <b>one</b> & two',
          message: 'expected <a> & "b"\n\nreceived | `c`',
        },
      ],
      options
    )

    expect(html).toContain(
      '<summary><b>test &lt;b&gt;one&lt;/b&gt; &amp; two</b> — <code>expected &lt;a&gt; &amp; "b"</code></summary>'
    )
    expect(html).toContain('```diff\nexpected <a> & "b"\n\nreceived | `c`\n```')
  })

  test('should extract diff pair as short reason', () => {
    const html = failedTestsToMarkdown(
      [
        {
          ...failedTest,
          message:
            'expect(received).toEqual(expected) // deep equality\n\n- Expected  - 1\n+ Received  + 1\n\n  Array [\n    Object {\n      "id": 1,\n-     "title": "my first post",\n+     "title": "first post",\n    },\n  ]',
        },
      ],
      options
    )

    expect(html).toContain(
      '— <code>- "title": "my first post" · + "title": "first post"</code></summary>'
    )
  })

  test('should extend fence when message contains backticks fence', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, message: 'some\n```\ncode\n```' }],
      options
    )

    expect(html).toContain('````diff\nsome\n```\ncode\n```\n````')
  })

  test('should remove stack-trace frames and Error prefix from messages', () => {
    const html = failedTestsToMarkdown(
      [
        {
          ...failedTest,
          message:
            'Error: expect(jest.fn()).toBeCalledWith(...expected)\n\nExpected: 200\nReceived: 201\n\nNumber of calls: 1\n    at Object.toBeCalledWith (/repo/__tests__/controller.test.js:35:29)\n    at processTicksAndRejections (node:internal/process/task_queues:103:5)',
        },
      ],
      options
    )

    expect(html).toContain(
      '```diff\nexpect(jest.fn()).toBeCalledWith(...expected)\n\nExpected: 200\nReceived: 201\n\nNumber of calls: 1\n```'
    )
    expect(html).not.toContain('Error:')
    expect(html).not.toContain('at Object.toBeCalledWith')
  })

  test('should keep specific error name prefixes in messages', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, message: 'TypeError: Service.list is not a function' }],
      options
    )

    expect(html).toContain(
      '```diff\nTypeError: Service.list is not a function\n```'
    )
  })

  test('should truncate long messages', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, message: 'a'.repeat(600) }],
      options
    )

    expect(html).toContain(`\`\`\`diff\n${'a'.repeat(500)}…\n\`\`\``)
    expect(html).not.toContain('a'.repeat(501))
  })

  test('should cap number of message lines', () => {
    const message = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join(
      '\n'
    )
    const html = failedTestsToMarkdown([{ ...failedTest, message }], options)

    expect(html).toContain('line 15\n…')
    expect(html).not.toContain('line 16')
  })

  test('should link test name to the test file', () => {
    const html = failedTestsToMarkdown(
      [
        {
          ...failedTest,
          file: '/home/runner/work/repo/repo/__tests__/failing/service.test.js',
          line: 25,
        },
      ],
      optionsWithRepo
    )

    expect(html).toContain(
      '<summary><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/__tests__/failing/service.test.js#L25">test one</a> — <code>'
    )
  })

  test('should link only suite name when test name starts with it', () => {
    const html = failedTestsToMarkdown(
      [
        {
          suiteName: 'PostsService',
          testName: 'PostsService maps the API response to posts',
          message: 'boom',
          file: '__tests__/failing/service.test.js',
          line: 25,
        },
      ],
      optionsWithRepo
    )

    expect(html).toContain(
      '<summary><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/__tests__/failing/service.test.js#L25">PostsService</a> › maps the API response to posts — <code>boom</code></summary>'
    )
  })

  test('should link test name without line when only file is known', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, file: '__tests__/failing/service.test.js' }],
      optionsWithRepo
    )

    expect(html).toContain(
      '<summary><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/__tests__/failing/service.test.js">test one</a> — <code>'
    )
  })

  test('should not link test name without repository or commit', () => {
    const html = failedTestsToMarkdown(
      [
        {
          suiteName: 'PostsService',
          testName: 'PostsService maps the API response to posts',
          message: 'boom',
          file: '__tests__/failing/service.test.js',
          line: 25,
        },
      ],
      options
    )

    expect(html).toContain(
      '<b>PostsService</b> › maps the API response to posts'
    )
    expect(html).not.toContain('<a href')
  })

  test('should cap number of rendered failed tests', () => {
    const failedTests: FailedTest[] = Array.from({ length: 35 }, (_, i) => ({
      ...failedTest,
      testName: `test ${i + 1}`,
    }))

    const html = failedTestsToMarkdown(failedTests, options)
    expect(html).toContain(':x: Failed Tests (<b>35</b>)')
    expect(html).toContain('test 30')
    expect(html).not.toContain('test 31')
    expect(html).toContain('...and 5 more failed tests')

    const htmlWithMax = failedTestsToMarkdown(failedTests, {
      showFailedTests: true,
      maxFailedTests: 10,
    } as never)
    expect(htmlWithMax).toContain('test 10')
    expect(htmlWithMax).not.toContain('test 11')
    expect(htmlWithMax).toContain('...and 25 more failed tests')
  })

  test('should not link test name when absolute path does not match prefix', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, file: '/other/place/service.test.js', line: 25 }],
      optionsWithRepo
    )

    expect(html).toContain('<b>test one</b>')
    expect(html).not.toContain('<a href')
  })

  test('should not prepend coverage-path-prefix to absolute stack-trace paths', () => {
    const html = failedTestsToMarkdown(
      [
        {
          ...failedTest,
          file: '/home/runner/work/repo/repo/__tests__/failing/service.test.js',
          line: 25,
        },
      ],
      { ...(optionsWithRepo as object), coveragePathPrefix: 'src/' } as never
    )

    expect(html).toContain(
      '<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/__tests__/failing/service.test.js#L25">test one</a>'
    )
  })

  test('should truncate very long test names', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, testName: 'a'.repeat(400) }],
      options
    )

    expect(html).toContain(`<b>${'a'.repeat(255)}…</b>`)
    expect(html).not.toContain('a'.repeat(256))
  })

  test('should url-encode reserved characters in linked test paths', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, file: '__tests__/a#b.test.js', line: 5 }],
      optionsWithRepo
    )

    expect(html).toContain('/__tests__/a%23b.test.js#L5">test one</a>')
  })

  test('should not link test name when remove-links-to-files is enabled', () => {
    const html = failedTestsToMarkdown(
      [{ ...failedTest, file: '__tests__/failing/service.test.js', line: 25 }],
      { ...(optionsWithRepo as object), removeLinksToFiles: true } as never
    )

    expect(html).toContain('<b>test one</b>')
    expect(html).not.toContain('<a href')
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
      '<b>should test controller</b> › when #getPost method method fails'
    )
    expect(failedTestsHtml).toContain(
      '<b>should test Service</b> › when #list method fails'
    )
    expect(failedTestsHtml).toContain(
      '<b>should test router</b> › should test get posts'
    )
    expect(failedTestsHtml).toContain(
      '— <code>Expected: "Hello" · Received: "Hi" &amp;'
    )
    expect(failedTestsHtml).toContain(
      'Expected: "Hello"\nReceived: "Hi" & <b>`bold`</b> | pipe'
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
