import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { ChangedFiles, Options } from './types.d'

/** Generate object of all files that changed based on commit through GitHub API. */
export async function getChangedFiles(
  options: Options
): Promise<ChangedFiles | null> {
  const all: string[] = []
  const added: string[] = []
  const modified: string[] = []
  const removed: string[] = []
  const renamed: string[] = []
  const addedOrModified: string[] = []
  const changedLines: Record<string, number[]> = {}

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
        core.warning(
          `"report-only-changed-files: true" supported only on 'pull_request' and 'push', '${eventName}' events are not supported.`
        )
        return null
    }

    core.startGroup('Changed files')
    // Log the base and head commits
    core.info(`Base commit: ${base}`)
    core.info(`Head commit: ${head}`)

    // Get the changed files. Paginate the compare endpoint so large PRs
    // (>300 files) don't silently lose changed-line data and let the gate
    // pass on partially-analyzed diffs.
    const files =
      base === '0000000000000000000000000000000000000000'
        ? // For the first commit in a repository we cannot get a diff.
          (await octokit.rest.repos.getCommit({ owner, repo, ref: head })).data
            .files
        : // https://developer.github.com/v3/repos/commits/#compare-two-commits
          await octokit.paginate(
            octokit.rest.repos.compareCommits,
            { base, head, owner, repo, per_page: 100 },
            (response) => response.data.files ?? []
          )

    if (files?.length) {
      for (const file of files) {
        const { filename: filenameOriginal, status } = file
        const filename = filenameOriginal.replace(
          options.coveragePathPrefix || '',
          ''
        )

        all.push(filename)

        // Capture the head-side line numbers touched by this file's patch so we can
        // compute patch (incremental) coverage against only the changed lines.
        if (file.patch) {
          changedLines[filename] = parsePatchAddedLines(file.patch)
        }

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
    changedLines,
  }
}

/**
 * Parse a unified-diff patch string and return the head-side (new file) line
 * numbers that were added or modified. Only `+` lines are considered "changed".
 */
export function parsePatchAddedLines(patch: string): number[] {
  const lines: number[] = []
  // Hunk header: @@ -oldStart,oldLen +newStart,newLen @@
  const hunkHeader = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/
  let newLineNo = 0

  for (const raw of patch.split('\n')) {
    const header = raw.match(hunkHeader)
    if (header) {
      newLineNo = parseInt(header[1], 10)
      continue
    }

    if (raw.startsWith('\\')) {
      // "\ No newline at end of file" marker - metadata, never a real line.
      continue
    }

    if (raw.startsWith('+')) {
      // Added/modified line present in the head revision.
      lines.push(newLineNo)
      newLineNo++
    } else if (raw.startsWith('-')) {
      // Deleted line - does not exist on the head side, do not advance.
    } else {
      // Context line - advances the head cursor.
      newLineNo++
    }
  }

  return lines
}
