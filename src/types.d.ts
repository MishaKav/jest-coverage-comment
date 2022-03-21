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
  hideSummary?: boolean
  createNewComment?: boolean
  hideComment?: boolean
  // pathPrefix: string
  // covFile: string
  // xmlFile: string
  // hideBadge: boolean
  // reportOnlyChangedFiles: boolean
  // defaultBranch: string
  // xmlTitle: string
  // multipleFiles: string[]
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

export interface CoverageReport {
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
