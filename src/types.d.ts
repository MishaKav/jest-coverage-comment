export interface Options {
  token: string
  repository: string
  summaryFile: string
  summaryTitle: string
  badgeTitle: string
  commit: string
  // prefix: string
  // pathPrefix: string
  // head: string
  // base: string
  // covFile: string
  // xmlFile: string
  // title: string
  // hideBadge: boolean
  // hideReport: boolean
  // createNewComment: boolean
  // hideComment: boolean
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
  html: string
  coverage: number
  color: CoverageColor
}

export interface FormattedCoverage {
  summary?: string
  details?: string
}
