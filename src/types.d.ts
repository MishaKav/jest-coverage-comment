export interface Options {
  token: string
  repository: string
  summaryFile: string
  summaryTitle?: string
  badgeTitle: string
  prefix: string
  watermark: string
  commit: string
  head?: string
  base?: string
  title?: string
  junitFile?: string
  junitTitle?: string
  coverageFile?: string
  coverageTitle?: string
  coveragePathPrefix?: string
  hideSummary?: boolean
  createNewComment?: boolean
  hideComment?: boolean
  reportOnlyChangedFiles?: boolean
  changedFiles?: ChangedFiles
}

// eslint-disable-next-line no-shadow
export enum FILE_STATUSES {
  ADDED = 'added',
  MODIFIED = 'modified',
  REMOVED = 'removed',
  RENAMED = 'renamed',
}
export type ChangedFiles = {
  all: string[]
  [FILE_STATUSES.ADDED]?: string[]
  [FILE_STATUSES.MODIFIED]?: string[]
  [FILE_STATUSES.REMOVED]?: string[]
  [FILE_STATUSES.RENAMED]?: string[]
  addedOrModified?: string[]
}

export interface LineSummary {
  total: number
  covered: number
  skipped: number
  pct: number
}

export interface Summary {
  lines: LineSummary
  statements: LineSummary
  functions: LineSummary
  branches: LineSummary
  branchesTrue: LineSummary
}

export type CoverageColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'brightgreen'

export interface SummaryReport {
  summaryHtml: string
  coverage: number
  color: CoverageColor
}

export interface Junit {
  skipped: number // calculated field
  tests: number
  failures: number
  errors: number
  time: number
}

export interface JunitReport extends Junit {
  junitHtml: string
}

export interface CoverageLine {
  file: string
  stmts: number
  branch: number
  funcs: number
  lines: number
  uncoveredLines: string[] | null
}

export interface CoverageReport {
  coverageHtml: string
  coverage: number
  color: CoverageColor
  branches: number
  functions: number
  lines: number
  statements: number
}
