import { BUNCH_OF_DASHES, BUNCH_OF_EQUALS } from './consts'
import { CoverageLine } from './types'

function parseLine(line: string): string[] {
  return line.split('|').map((l) => l.replace('%', '').replace('#s', '').trim())
}

function arrToLine(arr: string[]): CoverageLine {
  return {
    file: arr[0],
    stmts: Number(arr[1]),
    branch: Number(arr[2]),
    funcs: Number(arr[3]),
    lines: Number(arr[4]),
    uncoveredLines: arr[5].length ? arr[5].split(',') : null,
  } as CoverageLine
}

function isHeaderLine(arr: string[]): boolean {
  return ['File', 'Stmts', 'Lines'].every((s) => arr.includes(s))
}

function isTotalLine(arr: string[]): boolean {
  return arr.includes('All files')
}

function isFileLine(arr: string[]): boolean {
  return arr[0].includes('.')
}

function isFolderLine(arr: string[]): boolean {
  return !isFileLine(arr) && !isTotalLine(arr) && !isHeaderLine(arr)
}

export function parseCoverage(content: string): CoverageLine[] {
  const arr = content.split('\n')
  const result: CoverageLine[] = []
  const folders = []

  for (const line of arr) {
    if (line.includes('Coverage summary')) {
      break
    }

    if (
      line.includes(BUNCH_OF_EQUALS) ||
      line.includes(BUNCH_OF_DASHES) ||
      !line.trim().length
    ) {
      continue
    }

    const parsedLine = parseLine(line)
    const isFolder = isFolderLine(parsedLine)
    const isFile = isFileLine(parsedLine)
    const [fileName] = parsedLine

    if (isFolder) {
      if (folders.length) {
        folders.pop()
      }

      folders.push(fileName)
    }

    if (!isFolder && folders.length) {
      parsedLine[0] = `${folders.at(-1)}/${parsedLine.at(0)}`
    }

    if (isFolder || isFile) {
      result.push(arrToLine(parsedLine))
    }
  }

  return result
}
