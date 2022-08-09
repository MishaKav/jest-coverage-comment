import { BUNCH_OF_DASHES, BUNCH_OF_EQUALS } from './consts'
import { CoverageLine } from './types'
import stripAnsi from 'strip-ansi'

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
  return arr[0] === 'All files'
}

function isFileLine(arr: string[]): boolean {
  return arr[0].includes('.')
}

function isFolderLine(arr: string[]): boolean {
  return !isFileLine(arr) && !isHeaderLine(arr)
}

export function getTotalLine(
  coverageArr: CoverageLine[]
): CoverageLine | undefined {
  return coverageArr.find((c) => c.file === 'All files')
}

export function isFile(line: CoverageLine): boolean {
  return line?.file.includes('.')
}

export function isFolder(line: CoverageLine): boolean {
  return !isFile(line)
}

export function parseCoverage(content: string): CoverageLine[] {
  const arr = stripAnsi(content).split('\n')
  const result: CoverageLine[] = []
  const folders = []
  const startFrom = arr.findIndex((l) => l.includes(BUNCH_OF_DASHES))

  for (const line of arr.slice(startFrom)) {
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
    const isCurrentFolder = isFolderLine(parsedLine)
    const isCurrentFile = isFileLine(parsedLine)
    const [fileName] = parsedLine

    if (isCurrentFolder && !isTotalLine(parsedLine)) {
      if (folders.length) {
        folders.pop()
      }

      folders.push(fileName)
    }

    if (!isCurrentFolder && folders.length) {
      parsedLine[0] = `${folders.at(-1)}/${parsedLine.at(0)}`.replace('//', '/')
    }

    if (isCurrentFolder || isCurrentFile) {
      result.push(arrToLine(parsedLine))
    }
  }

  return result
}

export const exportedForTesting = {
  parseLine,
  isHeaderLine,
  isTotalLine,
  isFileLine,
  isFolderLine,
  arrToLine,
}
