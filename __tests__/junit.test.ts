import rewire from 'rewire'
import { expect, test, describe, jest } from '@jest/globals'
import { getJunitReport } from '../src/junit'

const junit = rewire('../lib/junit')

describe('parsing junit', () => {
  const parseJunit = junit.__get__('parseJunit')

  test('should parse xml string to junit', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><testsuites tests="6" failures="5" errors="4" time="0.732"></testsuites>`
    const junit = await parseJunit(xml)
    const { skipped, errors, failures, tests, time } = junit

    expect(skipped).toBe(0)
    expect(errors).toBe(4)
    expect(failures).toBe(5)
    expect(tests).toBe(6)
    expect(time).toBe(0.732)
  })

  test('should count skipped testsuites', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><testsuites name="jest tests"><testsuite skipped="3"></testsuite><testsuite skipped="2"></testsuite><testsuite skipped="1"></testsuite></testsuites>`
    const { skipped } = await parseJunit(xml)

    expect(skipped).toBe(6)
  })

  test('should return null when no content', async () => {
    const junit = await parseJunit(null)

    expect(junit).toBe(null)
  })
})

describe('parse junit and check report output', () => {
  const options = {
    token: 'token_123',
    repository: 'MishaKav/jest-coverage-comment',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: `<!-- Jest Coverage Comment: 1 -->\n`,
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
    // @ts-ignore
    const junit = await getJunitReport({})
    const { junitHtml, skipped, errors, failures, tests, time } = junit

    expect(junitHtml).toBe('')
    expect(skipped).toBe(0)
    expect(errors).toBe(0)
    expect(failures).toBe(0)
    expect(tests).toBe(0)
    expect(time).toBe(0)
  })
})
