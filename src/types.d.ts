export interface Options {
  token: string
  repository: string
  prefix: string
  pathPrefix: string
  commit: string
  head: string
  base: string
  summaryFile: string
  summaryTitle: string
  // covFile: string
  // xmlFile: string
  title: string
  badgeTitle: string
  hideBadge: boolean
  hideReport: boolean
  createNewComment: boolean
  hideComment: boolean
  reportOnlyChangedFiles: boolean
  defaultBranch: string
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

export interface Report {
  html: string
  coverage: string
  color: string
  warnings: number
}

export interface FormattedCoverage {
  summary?: string
  details?: string
}
