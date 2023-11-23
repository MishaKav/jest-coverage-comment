/* eslint-disable no-console */
import { mkdirSync, writeFileSync } from 'fs'
import { Options } from './types.d'
import { getJunitReport } from './junit'
import { getCoverageReport } from './coverage'
import { getSummaryReport } from './summary'
import { getMultipleReport } from './multi-files'
import { getMultipleJunitReport } from './multi-junit-files'

// import { getSummaryReport, getParsedXml } from './junitXml'

/*  
  Useful git commands
  git tag -a -m "First release" v1.0.0 && git push --follow-tags 
  git tag -d v1.0 
  git tag -d origin v1.0  

  # Remove all workflows from repo
  gh api repos/MishaKav/pytest-coverage-comment/actions/runs \
  | jq -r '.workflow_runs[] | select(.head_branch != "main") | "\(.id)"' \
  | gxargs -n1 -I '{}' gh api repos/MishaKav/pytest-coverage-comment/actions/runs/{} -X DELETE --silent

  # Remove all local branches
  git branch | grep -v "main" | xargs git branch -D
*/

function getPathToFile(pathToFile: string): string {
  if (!pathToFile) {
    return ''
  }

  // Supports absolute path like '/tmp/coverage-final.json'
  return pathToFile.startsWith('/') ? pathToFile : `${__dirname}/${pathToFile}`
}

async function main(): Promise<void> {
  try {
    const summaryFile = './../data/coverage_1/coverage-summary.json'
    const junitFile = './../data/coverage_1/junit.xml'
    const coverageFile = './../data/coverage_1/coverage.txt'
    const multipleFiles = [
      `Title1, ${getPathToFile('./../data/coverage_1/coverage-summary.json')}`,
      `Title2, ${getPathToFile(
        './../data/coverage_1/coverage-summary_2.json'
      )}`,
    ]
    const multipleJunitFiles = [
      `Title1, ${getPathToFile('./../data/coverage_1/junit.xml')}`,
      `Title2, ${getPathToFile('./../data/coverage_1/junit.xml')}`,
    ]
    const prefix = __dirname

    let finalHtml = ''

    const options: Options = {
      token: 'token_123',
      repository: 'MishaKav/jest-coverage-comment',
      serverUrl: 'https://github.com',
      commit: '05953710b21d222efa4f4535424a7af367be5a57',
      watermark: '<!-- Jest Coverage Comment: 1 -->\n',
      title: 'Jest Coverage Comment',
      prefix,
      badgeTitle: 'Coverage',
      summaryFile: getPathToFile(summaryFile),
      summaryTitle: '',
      junitFile: getPathToFile(junitFile),
      junitTitle: '',
      coverageFile: getPathToFile(coverageFile),
      coverageTitle: 'Coverage Report',
      coveragePathPrefix: '',
      reportOnlyChangedFiles: true,
      hideSummary: false,
      removeLinksToFiles: false,
      removeLinksToLines: false,
      changedFiles: {
        all: ['src/router.js', 'src/service.js', 'src/utils/config.js'],
      },
      multipleFiles,
      multipleJunitFiles,
    }

    const { summaryHtml } = getSummaryReport(options)

    finalHtml += options.title
      ? `# ${options.title}\n\n${summaryHtml}`
      : summaryHtml

    if (options.junitFile) {
      const { junitHtml } = await getJunitReport(options)
      finalHtml += junitHtml ? `\n\n${junitHtml}` : ''
    }

    if (options.coverageFile) {
      const { coverageHtml } = getCoverageReport(options)
      finalHtml += coverageHtml ? `\n\n${coverageHtml}` : ''
    }

    if (options.multipleFiles?.length) {
      finalHtml += `\n\n${getMultipleReport(options)}`
    }

    if (options.multipleJunitFiles?.length) {
      const markdown = await getMultipleJunitReport(options)
      finalHtml += `\n\n${markdown}`
    }

    if (!finalHtml || options.hideComment) {
      console.log('Nothing to report')
      return
    }

    const resultFile = `${__dirname}/../tmp/result.md`
    mkdirSync(`${__dirname}/../tmp`, { recursive: true })
    writeFileSync(resultFile, finalHtml)
    console.log(resultFile)
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
  }
}

main()
