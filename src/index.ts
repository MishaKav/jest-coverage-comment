import * as core from '@actions/core'
import { MAX_COMMENT_LENGTH } from './consts'
import { Options } from './types.d'
import { context } from '@actions/github'
import { createComment } from './create-comment'
import { getSummaryReport } from './summary'

async function main(): Promise<void> {
  try {
    const token = core.getInput('github-token', { required: true })
    const title = core.getInput('title', { required: false })
    const badgeTitle = core.getInput('badge-title', { required: false })
    const hideSummary = core.getBooleanInput('hide-summary', {
      required: false,
    })
    const summaryTitle = core.getInput('summary-title', { required: false })
    const summaryFile = core.getInput('coverage-summary-path', {
      required: false,
    })
    const createNewComment = core.getBooleanInput('create-new-comment', {
      required: false,
    })
    const hideComment = core.getBooleanInput('hide-comment', {
      required: false,
    })

    const { repo, owner } = context.repo
    const { eventName, payload } = context
    const watermark = `<!-- Jest Coverage Comment: ${context.job} -->\n`
    let finalHtml = ''

    const options: Options = {
      token,
      repository: `${owner}/${repo}`,
      prefix: `${process.env.GITHUB_WORKSPACE}/`,
      commit: '',
      watermark,
      title,
      summaryFile,
      summaryTitle,
      badgeTitle,
      hideSummary,
      createNewComment,
      hideComment,
    }

    if (eventName === 'pull_request' && payload) {
      options.commit = payload.pull_request?.head.sha
      options.head = payload.pull_request?.head.ref
      options.base = payload.pull_request?.base.ref
    } else if (eventName === 'push') {
      options.commit = payload.after
      options.head = context.ref
    }

    const report = getSummaryReport(options)
    const { coverage, color, summaryHtml } = report

    if (summaryHtml.length > MAX_COMMENT_LENGTH) {
      // generate new html without report
      core.warning(
        `Your comment is too long (maximum is ${MAX_COMMENT_LENGTH} characters), coverage summary report will not be added.`
      )
      // core.warning(
      //   `Try add: "--cov-report=term-missing:skip-covered", or add "hide-report: true", or add "report-only-changed-files: true"`
      // )
      // report = getSummaryReport({ ...options, hideReport: true })
    }

    if (coverage || summaryHtml) {
      core.startGroup(options.summaryTitle || 'Summary Title')
      core.info(`coverage: ${coverage}`)
      core.info(`color: ${color}`)
      core.info(`summaryHtml: ${summaryHtml}`)

      core.setOutput('coverage', coverage)
      core.setOutput('color', color)
      core.setOutput('summaryHtml', summaryHtml)
      core.endGroup()
    }

    if (title) {
      finalHtml += `# ${title}\n\n`
    }

    if (!options.hideSummary) {
      finalHtml += summaryHtml
    }

    if (!finalHtml || options.hideComment) {
      core.info('Nothing to report')
      return
    }

    const body = watermark + finalHtml
    await createComment(options, body)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

main()
