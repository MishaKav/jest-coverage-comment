import { expect, test, describe } from '@jest/globals'
import { getCoverageReport } from '../src/coverage'
import { Options } from '../src/types'
import { spyCore } from './setup'

describe('get coverage report', () => {
  const options: Options = {
    token: 'token_123',
    repository: 'MishaKav/jest-coverage-comment',
    serverUrl: 'https://github.com',
    commit: '05953710b21d222efa4f4535424a7af367be5a57',
    watermark: '<!-- Jest Coverage Comment: 1 -->\n',
    summaryTitle: '',
    prefix: '',
    coveragePathPrefix: '',
    badgeTitle: 'Coverage',
    coverageTitle: 'Coverage Report',
    coverageFile: `${__dirname}/../data/coverage_1/coverage.txt`,
    summaryFile: `${__dirname}/../data/coverage_1/coverage-summary.json`,
  }

  test('should return coverage report', () => {
    const {
      coverageHtml,
      coverage,
      color,
      branches,
      functions,
      lines,
      statements,
    } = getCoverageReport(options)

    expect(lines).toBe(coverage)
    expect(coverage).toBe(71)
    expect(color).toBe('yellow')
    expect(branches).toBe(100)
    expect(functions).toBe(28)
    expect(lines).toBe(71)
    expect(statements).toBe(70)
    expect(coverageHtml).toMatchInlineSnapshot(
      `"<details><summary>Coverage Report (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>68.29</td><td>100</td><td>33.33</td><td>68.29</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js">controller.js</a></td><td>46.66</td><td>100</td><td>33.33</td><td>46.66</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L5-L9">5&ndash;9</a>, <a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L23-L27">23&ndash;27</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js">index.js</a></td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js#L9">9</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/router.js">router.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js">service.js</a></td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js#L16-L20">16&ndash;20</a></td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/utils.js">utils.js</a></td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>"`,
    )
  })
  test('should return coverage report with custom github server url', () => {
    const {
      coverageHtml,
      coverage,
      color,
      branches,
      functions,
      lines,
      statements,
    } = getCoverageReport({
      ...options,
      serverUrl: 'https://private.azure.github.com',
    })

    expect(lines).toBe(coverage)
    expect(coverage).toBe(71)
    expect(color).toBe('yellow')
    expect(branches).toBe(100)
    expect(functions).toBe(28)
    expect(lines).toBe(71)
    expect(statements).toBe(70)
    expect(coverageHtml).toMatchInlineSnapshot(
      `"<details><summary>Coverage Report (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>68.29</td><td>100</td><td>33.33</td><td>68.29</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js">controller.js</a></td><td>46.66</td><td>100</td><td>33.33</td><td>46.66</td><td><a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L5-L9">5&ndash;9</a>, <a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L23-L27">23&ndash;27</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js">index.js</a></td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td><a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js#L9">9</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/router.js">router.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js">service.js</a></td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td><a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js#L16-L20">16&ndash;20</a></td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://private.azure.github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/utils.js">utils.js</a></td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>"`,
    )
  })

  test('should return coverage report without links to files', () => {
    const { coverageHtml } = getCoverageReport({
      ...options,
      removeLinksToFiles: true,
    })

    expect(coverageHtml).toMatchInlineSnapshot(
      `"<details><summary>Coverage Report (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>68.29</td><td>100</td><td>33.33</td><td>68.29</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;controller.js</td><td>46.66</td><td>100</td><td>33.33</td><td>46.66</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L5-L9">5&ndash;9</a>, <a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js#L23-L27">23&ndash;27</a></td></tr><tr><td>&nbsp; &nbsp;index.js</td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js#L9">9</a></td></tr><tr><td>&nbsp; &nbsp;router.js</td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;service.js</td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js#L16-L20">16&ndash;20</a></td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;config.js</td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;utils.js</td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>"`,
    )
  })

  test('should return coverage report without links to lines', () => {
    const { coverageHtml } = getCoverageReport({
      ...options,
      removeLinksToLines: true,
    })

    expect(coverageHtml).toMatchInlineSnapshot(
      `"<details><summary>Coverage Report (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>68.29</td><td>100</td><td>33.33</td><td>68.29</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/controller.js">controller.js</a></td><td>46.66</td><td>100</td><td>33.33</td><td>46.66</td><td>5&ndash;9, 23&ndash;27</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/index.js">index.js</a></td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td>9</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/router.js">router.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js">service.js</a></td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td>16&ndash;20</td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/utils.js">utils.js</a></td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>"`,
    )
  })

  test('should return coverage report without links to files and to lines', () => {
    const { coverageHtml } = getCoverageReport({
      ...options,
      removeLinksToFiles: true,
      removeLinksToLines: true,
    })

    expect(coverageHtml).toMatchInlineSnapshot(
      `"<details><summary>Coverage Report (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>68.29</td><td>100</td><td>33.33</td><td>68.29</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;controller.js</td><td>46.66</td><td>100</td><td>33.33</td><td>46.66</td><td>5&ndash;9, 23&ndash;27</td></tr><tr><td>&nbsp; &nbsp;index.js</td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td>9</td></tr><tr><td>&nbsp; &nbsp;router.js</td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;service.js</td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td>16&ndash;20</td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;config.js</td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;utils.js</td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>"`,
    )
  })

  test('should render coverage title', () => {
    const optionsWithTitle = { ...options, coverageTitle: 'coverageTitle' }
    const { coverageHtml, coverage } = getCoverageReport(optionsWithTitle)
    const title = `<summary>${optionsWithTitle.coverageTitle} (<b>${coverage}%</b>)</summary>`
    expect(coverageHtml).toContain(`${title}`)
  })

  test('should render message when no changed files', () => {
    const optionsChangedFiles = {
      ...options,
      reportOnlyChangedFiles: true,
      changedFiles: { all: [] },
    }
    const { coverageHtml } = getCoverageReport(optionsChangedFiles)
    expect(coverageHtml).toContain(
      '<i>report-only-changed-files is enabled. No files were changed in this commit :)</i>',
    )
  })

  test('should render only changed files', () => {
    const optionsChangedFiles = {
      ...options,
      reportOnlyChangedFiles: true,
      changedFiles: {
        all: ['src/router.js', 'src/service.js', 'src/utils/config.js'],
      },
    }
    const { coverageHtml } = getCoverageReport(optionsChangedFiles)
    expect(coverageHtml).toContain(
      '<details><summary>Coverage Report • (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>68.29</td><td>100</td><td>33.33</td><td>68.29</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/router.js">router.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js">service.js</a></td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td><a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/service.js#L16-L20">16&ndash;20</a></td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>',
    )
  })

  test('should not render empty folders when report only changed files', () => {
    const optionsChangedFiles = {
      ...options,
      reportOnlyChangedFiles: true,
      changedFiles: { all: ['src/utils/config.js'] },
    }
    const { coverageHtml } = getCoverageReport(optionsChangedFiles)
    expect(coverageHtml).toContain(
      '<details><summary>Coverage Report • (<b>71%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>70.21</b></td><td><b>100</b></td><td><b>28.57</b></td><td><b>71.73</b></td><td>&nbsp;</td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/jest-coverage-comment/blob/05953710b21d222efa4f4535424a7af367be5a57/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>',
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
    } = getCoverageReport({} as never)

    expect(coverageHtml).toBe('')
    expect(coverage).toBe(0)
    expect(color).toBe('red')
    expect(branches).toBe(0)
    expect(functions).toBe(0)
    expect(lines).toBe(0)
    expect(statements).toBe(0)
  })

  test('should return default report on error', () => {
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

    expect(spyCore.error).toHaveBeenCalledTimes(1)
    expect(spyCore.error).toHaveBeenCalledWith(
      "Generating coverage report. Cannot read properties of undefined (reading 'length')",
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
