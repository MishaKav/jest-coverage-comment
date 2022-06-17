import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { Options } from './types.d'

export async function createComment(
  options: Options,
  body: string
): Promise<void> {
  try {
    const { eventName, payload } = context
    const { repo, owner } = context.repo

    const octokit = getOctokit(options.token)
    const issue_number = payload.pull_request ? payload.pull_request.number : 0

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
      console.log(error.message) // eslint-disable-line no-console
    }
  }
}
