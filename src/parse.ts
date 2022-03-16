import * as core from '@actions/core'

// return full html coverage report and coverage percenatge
export function getCoverageReport(): {
  html: string
  coverage: string
  color: string
  warnings: number
} {
  // const { covFile } = options;

  try {
    // const covFilePath = getPathToFile(covFile);
    // const content = getContentFile(covFilePath);
    // const coverage = getTotalCoverage(content);
    // const isValid = isValidCoverageContent(content);
    // if (content && !isValid) {
    //   core.error(
    //     `Error: coverage file "${covFilePath}" has bad format or wrong data`
    //   );
    // }
    // if (content && isValid) {
    //   const html = toHtml(content, options);
    //   const total = getTotal(content);
    //   const warnings = getWarnings(content);
    //   const color = getCoverageColor(total ? total.cover : '0');
    //   return { html, coverage, color, warnings };
    // }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Generating coverage report. ${error.message}`)
    }
  }

  return { html: '', coverage: '0', color: 'red', warnings: 0 }
}
