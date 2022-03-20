export interface Options {
  token: string
  repository: string
  summaryFile: string
  summaryTitle?: string
  badgeTitle: string
  commit?: string
  head?: string
  base?: string
  prefix: string
  title?: string
  // hideReport?: boolean
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

export interface FormattedCoverage {
  summary?: string
  details?: string
}
