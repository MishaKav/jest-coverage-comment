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
    lineCoverageMain: '0',
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
})
