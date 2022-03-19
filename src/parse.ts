// import * as core from '@actions/core'
// import { BUNCH_OF_DASHES, BUNCH_OF_EQUALS } from './consts'
// import { FormattedCoverage, Options } from './types.d'
// import { getContentFile } from './utils'

// // return full html coverage report and coverage percenatge
// export function getCoverageReport(options: Options): Report {
//   const { covFile } = options

//   try {
//     const covFilePath = getPathToFile(covFile)
//     const content = getContentFile(covFilePath)
//     const sumamry = processTextSummaryReporter(content)
//     // const coverage = getTotalCoverage(content);
//     // const isValid = isValidCoverageContent(content);
//     // if (content && !isValid) {
//     //   core.error(
//     //     `Error: coverage file "${covFilePath}" has bad format or wrong data`
//     //   );
//     // }
//     // if (content && isValid) {
//     //   const html = toHtml(content, options);
//     //   const total = getTotal(content);
//     //   const warnings = getWarnings(content);
//     //   const color = getCoverageColor(total ? total.cover : '0');
//     //   return { html, coverage, color, warnings };
//     // }
//   } catch (error) {
//     if (error instanceof Error) {
//       core.error(`Generating coverage report. ${error.message}`)
//     }
//   }

//   return { html: '', coverage: '0', color: 'red', warnings: 0 }
// }

// const processTextSummaryReporter = (
//   codeCoverage: string
// ): FormattedCoverage => {
//   const result = []
//   const codeCoverageLines = codeCoverage.split('\n')
//   let foundBeginning = false

//   for (const codeCoverageLine of codeCoverageLines) {
//     if (foundBeginning) {
//       result.push(codeCoverageLine)
//     }

//     if (codeCoverageLine.startsWith(BUNCH_OF_EQUALS)) {
//       if (foundBeginning) {
//         break
//       }
//       foundBeginning = true
//       result.push(codeCoverageLine)
//     }
//   }

//   return { summary: result.join('\n') }
// }
