/* eslint-disable no-console */
import * as path from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { Options } from './types.d'
import { getSummaryReport } from './summary'

// import { getSummaryReport, getParsedXml } from './junitXml'

/*  
  Usefull git commands
  git tag -a -m "Export coverage example" v1.1.7 && git push --follow-tags 
  git tag -d v1.0 
  git tag -d origin v1.0  

  # remove all workflows from repo
  gh api repos/MishaKav/pytest-coverage-comment/actions/runs \
  | jq -r '.workflow_runs[] | select(.head_branch != "main") | "\(.id)"' \
  | gxargs -n1 -I '{}' gh api repos/MishaKav/pytest-coverage-comment/actions/runs/{} -X DELETE --silent

  # remove all local branches
  git branch | grep -v "main" | xargs git branch -D
*/

function getPathToFile(pathToFile: string): string {
  if (!pathToFile) {
    return ''
  }

  // suports absolute path like '/tmp/coverage-final.json'
  return pathToFile.startsWith('/') ? pathToFile : `${__dirname}/${pathToFile}`
}

async function main(): Promise<void> {
  try {
    const summaryFile = './../data/coverage_1/coverage-summary.json'
    const covFile = './../data/coverage_1/coverage.txt'
    // const xmlFile = './../data/coverage/clover.xml'
    const prefix = `${path.dirname(path.dirname(path.resolve(covFile)))}/`

    let finalHtml = ''

    const options: Options = {
      token: 'token_123',
      repository: 'MishaKav/jest-coverage-comment',
      commit: 'f9d42291812ed03bb197e48050ac38ac6befe4e5',
      prefix,
      pathPrefix: '',
      summaryFile: getPathToFile(summaryFile),
      summaryTitle: '',
      // covFile: getPathToFile(covFile),
      // xmlFile: getPathToFile(xmlFile),
      defaultBranch: 'main',
      head: 'feat/test',
      base: 'main',
      title: 'Coverage Report',
      badgeTitle: 'Coverage',
      hideBadge: false,
      hideReport: false,
      createNewComment: false,
      reportOnlyChangedFiles: false,
      hideComment: false,
      // xmlTitle: '',
      // changedFiles: {
      //   all: [
      //     'functions/example_completed/example_completed.py',
      //     'functions/example_manager/example_manager.py',
      //     'functions/example_manager/example_static.py',
      //   ],
      // },
    }

    const html = getSummaryReport(options)
    // const summaryReport = null //getSummaryReport(options);

    // set to output junitxml values
    // if (summaryReport) {
    //   const parsedXml = getParsedXml(options)
    //   const { errors, failures, skipped, tests, time } = parsedXml
    //   const valuesToExport = { errors, failures, skipped, tests, time }

    //   Object.entries(valuesToExport).forEach(([key, value]) => {
    //     console.log(key, value)
    //   })
    // }

    finalHtml += html
    // finalHtml += finalHtml.length ? `\n\n${summaryReport}` : summaryReport

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
