import * as core from '@actions/core'
import { expect, test, describe, jest } from '@jest/globals'
import { getCoverageReport } from '../src/coverage'
import { Options } from '../src/types'

describe('get coverage report', () => {
  const options: Options = {
    token: 'token_123',
    repository: 'MishaKav/jest-coverage-comment',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: `<!-- Jest Coverage Comment: 1 -->\n`,
    summaryTitle: '',
    prefix: '',
    coveragePathPrefix: '',
    badgeTitle: 'Coverage',
    coverageTitle: 'Coverage Report',
    coverageFile: `${__dirname}/../data/coverage_1/coverage.txt`,
    summaryFile: `${__dirname}/../data/coverage_1/coverage-summary.json`,
  }

  test('should return coverage report', () => {
    const html = `<details><summary>Coverage Report (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>68.29</td><td>100</td><td>33.33</td><td>68.29</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js">controller.js</a></td><td>46.66</td><td>100</td><td>33.33</td><td>46.66</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L5-L9">5&ndash;9</a>, <a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L23-L27">23&ndash;27</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js">index.js</a></td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js#L9">9</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/router.js">router.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js">service.js</a></td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js#L16-L20">16&ndash;20</a></td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/utils.js">utils.js</a></td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>`

    const {
      coverageHtml,
      coverage,
      color,
      branches,
      functions,
      lines,
      statements,
    } = getCoverageReport(options)

    expect(coverageHtml).toBe(html)
    expect(lines).toBe(coverage)
    expect(coverage).toBe(71)
    expect(color).toBe('yellow')
    expect(branches).toBe(100)
    expect(functions).toBe(28)
    expect(lines).toBe(71)
    expect(statements).toBe(70)
  })

  test('should render coverage title', () => {
    const optionsWithTitle = { ...options, coverageTitle: 'coverageTitle' }
    const { coverageHtml, coverage } = getCoverageReport(optionsWithTitle)
    const title = `<summary>${optionsWithTitle.coverageTitle} (<b>${coverage}%</b>)</summary>`
    expect(coverageHtml).toContain(`${title}`)
  })

  test('should render message when no chanegd files', () => {
    const optionsChangedFiles = {
      ...options,
      reportOnlyChangedFiles: true,
      changedFiles: { all: [] },
    }
    const { coverageHtml } = getCoverageReport(optionsChangedFiles)
    expect(coverageHtml).toContain(
      `<i>report-only-changed-files is enabled. No files were changed during this commit :)</i>`
    )
  })

  test('should return default report', () => {
    const {
      coverageHtml,
      coverage,
      color,
      branches,
      functions,
      lines,
      statements,
      // @ts-ignore
    } = getCoverageReport({})

    expect(coverageHtml).toBe('')
    expect(coverage).toBe(0)
    expect(color).toBe('red')
    expect(branches).toBe(0)
    expect(functions).toBe(0)
    expect(lines).toBe(0)
    expect(statements).toBe(0)
  })

  test('should return default report on error', () => {
    const spy = jest.spyOn(core, 'error')
    const optionsWithWrongFile = {
      ...options,
      coverageFile: options.summaryFile,
    }
    const {
      coverageHtml,
      coverage,
      color,
      branches,
      functions,
      lines,
      statements,
    } = getCoverageReport(optionsWithWrongFile)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      `Generating coverage report. Cannot read properties of undefined (reading 'length')`
    )
    expect(coverageHtml).toBe('')
    expect(coverage).toBe(0)
    expect(color).toBe('red')
    expect(branches).toBe(0)
    expect(functions).toBe(0)
    expect(lines).toBe(0)
    expect(statements).toBe(0)
  })
})
