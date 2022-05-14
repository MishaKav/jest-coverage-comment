import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { ChangedFiles, Options } from './types.d'

// generate object of all files that changed based on commit through Github API
export async function getChangedFiles(options: Options): Promise<ChangedFiles> {
  const all = []
  const added = []
  const modified = []
  const removed = []
  const renamed = []
  const addedOrModified = []

  try {
    const { eventName, payload } = context
    const { repo, owner } = context.repo
    const octokit = getOctokit(options.token)

    // Define the base and head commits to be extracted from the payload
    let base
    let head

    switch (eventName) {
      case 'pull_request':
        base = payload.pull_request?.base.sha
        head = payload.pull_request?.head.sha
        break
      case 'push':
        base = payload.before
        head = payload.after
        break
      default:
        core.setFailed(
          `This action only supports pull requests and pushes, ${eventName} events are not supported. ` +
            "Please submit an issue on this action's GitHub repo if you believe this in correct."
        )
    }

    core.startGroup('Changed files')
    // Log the base and head commits
    core.info(`Base commit: ${base}`)
    core.info(`Head commit: ${head}`)

    // Use GitHub's compare two commits API.
    // https://developer.github.com/v3/repos/commits/#compare-two-commits
    const response = await octokit.rest.repos.compareCommits({
      base,
      head,
      owner,
      repo,
    })

    // Ensure that the request was successful.
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${eventName} event returned ${response.status}, expected 200. ` +
          "Please submit an issue on this action's GitHub repo."
      )
    }

    // https://github.com/MishaKav/jest-coverage-comment/issues/10
    // Ensure that the head commit is ahead of the base commit.
    // if (response.data.status !== 'ahead') {
    //   core.setFailed(
    //     `The head commit for this ${eventName} event is not ahead of the base commit. ` +
    //       "Please submit an issue on this action's GitHub repo."
    //   )
    // }

    // Get the changed files from the response payload.
    const files = response.data.files

    if (files?.length) {
      for (const file of files) {
        const { filename: filenameOriginal, status } = file
        const filename = filenameOriginal.replace(
          options.coveragePathPrefix || '',
          ''
        )

        all.push(filename)

        switch (status) {
          case 'added':
            added.push(filename)
            addedOrModified.push(filename)
            break
          case 'modified':
            modified.push(filename)
            addedOrModified.push(filename)
            break
          case 'removed':
            removed.push(filename)
            break
          case 'renamed':
            renamed.push(filename)
            break
          default:
            core.setFailed(
              `One of your files includes an unsupported file status '${status}', expected added, modified, removed, renamed`
            )
        }
      }
    }

    core.info(`All: ${all.join(',')}`)
    core.info(`Added: ${added.join(', ')}`)
    core.info(`Modified: ${modified.join(', ')}`)
    core.info(`Removed: ${removed.join(', ')}`)
    core.info(`Renamed: ${renamed.join(', ')}`)
    core.info(`Added or modified: ${addedOrModified.join(', ')}`)

    core.endGroup()
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }

  return {
    all,
    added,
    modified,
    removed,
    renamed,
    addedOrModified,
  }
}
