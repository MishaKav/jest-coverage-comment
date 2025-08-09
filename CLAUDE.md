# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Jest Coverage Comment GitHub Action - a TypeScript-based action that comments on pull requests or commits with Jest code coverage reports, including badges, full reports, and test summaries.

## Core Architecture

The action follows a modular architecture:

- **Main Entry**: `src/index.ts` - Orchestrates the entire workflow, gathering inputs and coordinating report generation
- **Report Generators**: Separate modules for each report type (coverage, junit, summary, multi-file reports)
- **Comment Management**: `src/create-comment.ts` handles GitHub API interactions for creating/updating PR comments
- **Utilities**: Helper functions in `src/utils.ts` for common operations

The action supports multiple report formats:

- Coverage summary from `coverage-summary.json`
- JUnit XML reports for test results
- Console output coverage reports
- Multiple file reports for monorepo support

## Common Development Commands

```bash
# Install dependencies
npm ci

# Build TypeScript to JavaScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Generate coverage report with console output
npm run test:coverage:tee

# Format code
npm run format

# Check formatting
npm run format-check

# Lint code
npm run lint

# Package for distribution (creates dist/index.js)
npm run package

# Run all checks (build, format, lint, package, test)
npm run all
```

## Testing

The project uses Jest with TypeScript support:

- Test files are in `__tests__/` directory
- Run a single test: `npx jest __tests__/specific.test.ts`
- Coverage reports are generated in `coverage/` directory
- JUnit reports are generated via `jest-junit` package

## Key Implementation Details

**GitHub Action Inputs/Outputs**: Defined in `action.yml`, processed in `src/index.ts`

**Report Generation Flow**:

1. Action receives inputs via GitHub Actions core API
2. Retrieves changed files if needed (for PR-only reporting)
3. Generates each report type based on available data
4. Combines reports into markdown comment
5. Posts/updates comment on PR or commit

**Coverage Calculation**: Uses Jest's `coverage-summary.json` for percentage calculations, with color-coded badges based on thresholds (0-40: red, 40-60: orange, 60-80: yellow, 80-90: green, 90-100: brightgreen)

**File Path Handling**: The action handles both absolute and relative paths, with configurable path prefixes for linking to files in GitHub
