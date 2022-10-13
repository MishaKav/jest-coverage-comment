import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { Options } from './types.d'

const MAX_COMMENT_LENGTH = 65536

export async function createComment(
  options: Options,
  body: string
): Promise<void> {
  try {
    const { eventName, payload } = context
    const { repo, owner } = context.repo

    const octokit = getOctokit(options.token)
    const issue_number = payload.pull_request ? payload.pull_request.number : 0

    if (body.length > MAX_COMMENT_LENGTH) {
      const warningsArr = [
        `Your comment is too long (maximum is ${MAX_COMMENT_LENGTH} characters), coverage report will not be added.`,
        `Try one/some of the following:`,
        `- add "['text-summary', { skipFull: true }]" - to remove fully covered files from report`,
        `- add "hide-summary: true" - to remove the summary report`,
      ]

      if (!options.reportOnlyChangedFiles) {
        // prettier-ignore
        warningsArr.push(`- add "report-only-changed-files: true" - to report only changed files and not all files`)
      }

      if (!options.removeLinksToFiles) {
        // prettier-ignore
        warningsArr.push(`- add "remove-links-to-files: true" - to remove links to files`)
      }

      if (!options.removeLinksToLines) {
        // prettier-ignore
        warningsArr.push(`- add "remove-links-to-lines: true" - to remove links to lines`)
      }

      core.warning(warningsArr.join('\n'))
    }

    if (eventName === 'push') {
      core.info('Create commit comment')

      await octokit.rest.repos.createCommitComment({
        repo,
        owner,
        commit_sha: options.commit,
        body,
      })
    }

    if (eventName === 'pull_request') {
      if (options.createNewComment) {
        core.info('Creating a new comment')

        await octokit.rest.issues.createComment({
          repo,
          owner,
          issue_number,
          body,
        })
      } else {
        // Now decide if we should issue a new comment or edit an old one
        const { data: comments } = await octokit.rest.issues.listComments({
          repo,
          owner,
          issue_number,
        })

        const comment = comments.find(
          (c) =>
            c.user?.login === 'github-actions[bot]' &&
            c.body?.startsWith(options.watermark)
        )

        if (comment) {
          core.info('Found previous comment, updating')
          await octokit.rest.issues.updateComment({
            repo,
            owner,
            comment_id: comment.id,
            body,
          })
        } else {
          core.info('No previous comment found, creating a new one')
          await octokit.rest.issues.createComment({
            repo,
            owner,
            issue_number,
            body,
          })
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    }
  }
}
