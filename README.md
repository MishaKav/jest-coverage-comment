# Jest Coverage Comment

![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/MishaKav/5e90d640f8c212ab7bbac38f72323f80/raw/jest-coverage-comment__main.json)
![License](https://img.shields.io/github/license/MishaKav/jest-coverage-comment)
![Version](https://img.shields.io/github/package-json/v/MishaKav/jest-coverage-comment)
[![WakaTime](https://wakatime.com/badge/user/f838c8aa-c197-42f0-b335-cd1d26159dfd/project/9b2410f3-4104-44ec-bd7f-8d2553a31ffb.svg)](https://wakatime.com/badge/user/f838c8aa-c197-42f0-b335-cd1d26159dfd/project/9b2410f3-4104-44ec-bd7f-8d2553a31ffb)

A GitHub Action that adds Jest test coverage reports as comments to your pull requests, helping you track and improve test coverage with visual feedback.

## 🎯 Features

- 📊 **Visual Coverage Reports** - Automatically comments on PRs with detailed coverage tables
- 🏷️ **Coverage Badges** - Dynamic badges showing coverage percentage with color coding
- 📈 **Test Statistics** - Shows passed, failed, skipped tests with execution time via JUnit XML
- ❌ **Failed Tests Table** - Optionally displays which tests failed with error messages for quick debugging
- 🔗 **Direct File Links** - Click to view uncovered lines directly in your repository
- 📁 **Multiple Reports** - Support for monorepo with multiple coverage reports
- 🎨 **Customizable** - Flexible titles, badges, and display options
- 📝 **Multi-Format Support** - Works with JSON summary, console output, and JUnit XML
- 🚀 **Smart Updates** - Updates existing comments instead of creating duplicates

## 📋 Table of Contents

<details>
<summary>Click to expand</summary>

- [Jest Coverage Comment](#jest-coverage-comment)
  - [🎯 Features](#-features)
  - [📋 Table of Contents](#-table-of-contents)
  - [🚀 Quick Start](#-quick-start)
  - [⚙️ Configuration](#️-configuration)
    - [Inputs](#inputs)
    - [Outputs](#outputs)
  - [📚 Usage Examples](#-usage-examples)
    - [Basic Usage](#basic-usage)
    - [Complete Configuration](#complete-configuration)
    - [Coverage Summary Report](#coverage-summary-report)
    - [Coverage Console Report](#coverage-console-report)
    - [JUnit Test Report](#junit-test-report)
    - [Multiple Files (Monorepo)](#multiple-files-monorepo)
    - [Matrix Strategy](#matrix-strategy)
    - [Workflow Dispatch Support](#workflow-dispatch-support)
    - [Changed Files Only](#changed-files-only)
    - [Auto-Update README Badge](#auto-update-readme-badge)
  - [🔬 Advanced Features](#-advanced-features)
  - [🎨 Badge Colors](#-badge-colors)
  - [📸 Result Examples](#-result-examples)
    - [Complete Comment Example](#complete-comment-example)
    - [Text Mode Example](#text-mode-example)
    - [Coverage Summary Report](#coverage-summary-report-1)
    - [Coverage Console Report](#coverage-console-report-1)
    - [JUnit Test Report](#junit-test-report-1)
    - [Multiple Files (Monorepo)](#multiple-files-monorepo-1)
  - [🔧 Troubleshooting](#-troubleshooting)
    - [Comment Not Appearing](#comment-not-appearing)
    - [Coverage Report Too Large](#coverage-report-too-large)
    - [Coverage Shows 0%](#coverage-shows-0)
    - [Files Not Found](#files-not-found)
    - [Wrong File Links](#wrong-file-links)
    - [Workflow Dispatch Events](#workflow-dispatch-events)
  - [🤝 Contributing](#-contributing)
    - [Development Setup](#development-setup)
  - [👥 Contributors](#-contributors)
  - [📄 License](#-license)
  - [🔗 Similar Actions](#-similar-actions)

</details>

## 🚀 Quick Start

Add this action to your workflow:

```yaml
- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
```

<details>
<summary>📖 Complete workflow example</summary>

```yaml
name: Jest Coverage Comment
on:
  pull_request:
    branches:
      - '*'

permissions:
  contents: read
  pull-requests: write

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npx jest --coverage --coverageReporters json-summary

      - name: Jest Coverage Comment
        uses: MishaKav/jest-coverage-comment@main
```

</details>

## ⚙️ Configuration

### Inputs

<details>
<summary>📝 Core Inputs</summary>

| Name                    | Required | Default                            | Description                                                                            |
| ----------------------- | -------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `github-token`          | ✓        | `${{github.token}}`                | GitHub API Access Token                                                                |
| `issue-number`          |          |                                    | Pull request number to comment on (required for workflow_dispatch/workflow_run events) |
| `coverage-summary-path` |          | `./coverage/coverage-summary.json` | The location of the coverage-summary of Jest                                           |
| `junitxml-path`         |          |                                    | The location of the junitxml path (npm package `jest-junit` should be installed)       |
| `coverage-path`         |          |                                    | The location of the coverage.txt (Jest console output)                                 |

</details>

<details>
<summary>🎨 Display Options</summary>

| Name                    | Default           | Description                                                   |
| ----------------------- | ----------------- | ------------------------------------------------------------- |
| `title`                 |                   | Main title for the comment                                    |
| `summary-title`         |                   | Title for the coverage summary                                |
| `badge-title`           | `Coverage`        | Title for the badge icon                                      |
| `text-instead-badge`    | `false`           | Use simple text instead of badge images for coverage display  |
| `junitxml-title`        |                   | Title for summary for junitxml                                |
| `show-failed-tests`     | `false`           | Show a table with the names of failed tests (requires junitxml-path) |
| `coverage-title`        | `Coverage Report` | Title for the coverage report                                 |
| `hide-summary`          | `false`           | Hide coverage summary report                                  |
| `hide-comment`          | `false`           | Hide the whole comment (use when you need only the `output`)  |
| `remove-links-to-files` | `false`           | Remove links to files (useful when summary-report is too big) |
| `remove-links-to-lines` | `false`           | Remove links to lines (useful when summary-report is too big) |

</details>

<details>
<summary>🔧 Advanced Options</summary>

| Name                        | Default | Description                                                                                                                                                              |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `create-new-comment`        | `false` | When false, will update the same comment, otherwise will publish new comment on each run                                                                                 |
| `unique-id-for-comment`     |         | When running in a matrix, pass the matrix value, so each comment will be updated its own comment                                                                         |
| `coverage-path-prefix`      |         | Prefix for path when link to files in comment                                                                                                                            |
| `report-only-changed-files` | `false` | Show in report only changed files for this commit, and not all files                                                                                                     |
| `multiple-files`            |         | You can pass array of `json-summary.json` files and generate single comment with table of results<br/>Single line should look like `Title1, ./path/to/json-summary.json` |
| `multiple-junitxml-files`   |         | You can pass array of `junit.xml` files and generate single comment with table of results<br/>Single line should look like `Title1, ./path/to/junit.xml`                 |

</details>

### Outputs

<details>
<summary>📤 Available Outputs</summary>

| Name          | Example  | Description                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `coverage`    | `78`     | Percentage of the coverage, get from `coverage-summary.json`                          |
| `color`       | `yellow` | Color of the percentage. You can see the whole list of [badge colors](#-badge-colors) |
| `summaryHtml` | `...`    | Markdown table with summary. See the [result examples](#-result-examples)             |
| `tests`       | `9`      | Total number of tests, get from `junitxml`                                            |
| `skipped`     | `0`      | Total number of skipped tests, get from `junitxml`                                    |
| `failures`    | `0`      | Total number of tests with failures, get from `junitxml`                              |
| `errors`      | `0`      | Total number of tests with errors, get from `junitxml`                                |
| `time`        | `2.883`  | Seconds that took to run all the tests, get from `junitxml`                           |
| `lines`       | `71`     | Lines covered, get from Jest text report                                              |
| `branches`    | `100`    | Branches covered, get from Jest text report                                           |
| `functions`   | `28`     | Functions covered, get from Jest text report                                          |
| `statements`  | `100`    | Statements covered, get from Jest text report                                         |

</details>

## 📚 Usage Examples

### Basic Usage

<details>
<summary>Standard PR Comment</summary>

```yaml
name: Jest Coverage Comment
on:
  pull_request:
jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run tests with coverage
        run: npx jest --coverage --coverageReporters json-summary
      - name: Jest Coverage Comment
        uses: MishaKav/jest-coverage-comment@main
```

This will create a comment showing coverage percentage with a badge and summary table.

</details>

### Complete Configuration

<details>
<summary>Example showing all available parameters</summary>

```yaml
- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    coverage-summary-path: ./coverage/coverage-summary.json
    title: My Jest Coverage Comment
    summary-title: My Summary Title
    badge-title: Coverage
    text-instead-badge: false
    hide-comment: false
    create-new-comment: false
    hide-summary: false
    remove-links-to-files: false
    remove-links-to-lines: false
    junitxml-title: My JUnit Title
    junitxml-path: ./coverage/junit.xml
    coverage-title: My Coverage Title
    coverage-path: ./coverage.txt
    coverage-path-prefix: src/
    report-only-changed-files: false
```

<img alt="Example Comment" width="600px" src="https://user-images.githubusercontent.com/289035/161066760-40876696-c2cc-432a-9a7c-0952239941f3.png">

</details>

### Coverage Summary Report

<details>
<summary>Generate summary from JSON coverage report</summary>

Configure Jest to generate JSON summary:

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageReporters: ['json-summary', 'text', 'html'],
  coverageDirectory: 'coverage',
}
```

Workflow:

```yaml
- name: Run tests
  run: npx jest --coverage

- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    coverage-summary-path: ./coverage/coverage-summary.json
```

**Output**: Badge with coverage percentage and summary table showing file-by-file coverage.

<img alt="Summary Report" width="450px" src="https://user-images.githubusercontent.com/289035/161067781-b162f85f-5ff4-4e00-b0f9-e487b3a10f9f.png">

</details>

### Coverage Console Report

<details>
<summary>Generate report from Jest console output with file links</summary>

```yaml
- name: Run tests
  run: npx jest --coverage | tee ./coverage.txt && exit ${PIPESTATUS[0]}

- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    coverage-path: ./coverage.txt
    coverage-title: Detailed Coverage Report
```

**Output**: Expandable section with detailed coverage report, including clickable links to files and specific uncovered lines.

<img alt="Coverage Report (Single File)" width="550px" src="https://user-images.githubusercontent.com/289035/161068864-25d8878a-2c82-4f83-b7dc-70a5a955b877.png">

</details>

### JUnit Test Report

<details>
<summary>Add test results with jest-junit package</summary>

Install jest-junit:

```bash
npm install --save-dev jest-junit
```

Configure Jest:

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'coverage', outputName: 'junit.xml' }],
  ],
}
```

Workflow:

```yaml
- name: Run tests
  run: npx jest --coverage

- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    junitxml-path: ./coverage/junit.xml
    junitxml-title: Test Results
```

**Output**: Table showing tests count, skipped, failures, errors, and execution time.

<img alt="JUnit Report (Single File)" width="400px" src="https://user-images.githubusercontent.com/289035/161068120-303b47a9-c8e2-4fa6-80db-21aefbf9033b.png">

</details>

<details>
<summary>Show Failed Tests Table (New in v1.0.30)</summary>

To display a detailed table of failed tests, enable the `show-failed-tests` option:

```yaml
- name: Run tests
  run: npx jest --coverage

- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    junitxml-path: ./coverage/junit.xml
    junitxml-title: Test Results
    show-failed-tests: true
```

**Output**: In addition to the standard test statistics, a "Failed Tests" table will be shown with:
- Test name
- Error message (first line, truncated to 100 characters)

This provides quick visibility into which tests failed without having to dig through logs, making it easier to identify and address test failures directly from the pull request comment.

</details>

### Multiple Files (Monorepo)

<details>
<summary>Generate combined report for multiple packages</summary>

```yaml
- name: Run tests for all packages
  run: |
    cd packages/frontend && npm test -- --coverage --coverageDirectory ../../coverage/frontend
    cd packages/backend && npm test -- --coverage --coverageDirectory ../../coverage/backend
    cd packages/shared && npm test -- --coverage --coverageDirectory ../../coverage/shared

- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    multiple-files: |
      Frontend, ./coverage/frontend/coverage-summary.json
      Backend, ./coverage/backend/coverage-summary.json
      Shared Utils, ./coverage/shared/coverage-summary.json
    multiple-junitxml-files: |
      Frontend Tests, ./coverage/frontend/junit.xml
      Backend Tests, ./coverage/backend/junit.xml
      Shared Tests, ./coverage/shared/junit.xml
```

**Output**: Combined table showing coverage and test results for all packages.

<img alt="Coverage Report (Multiple Files)" width="550px" src="https://user-images.githubusercontent.com/289035/183769452-99e53ad9-5205-44b7-bba6-c8d481ce5cc4.png">

<img alt="JUnit Report (Multiple Files)" width="600px" src="https://user-images.githubusercontent.com/289035/195997703-95d331a3-beba-4567-831e-22d1f0e977da.png">

</details>

### Matrix Strategy

<details>
<summary>Multiple Node.js versions with separate comments</summary>

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
  - run: npm ci
  - run: npm test -- --coverage
  - name: Jest Coverage Comment
    uses: MishaKav/jest-coverage-comment@main
    with:
      unique-id-for-comment: node-${{ matrix.node-version }}
      title: Coverage Report (Node.js ${{ matrix.node-version }})
```

**Output**: Separate coverage comments for each Node.js version, each updating independently.

</details>

### Workflow Dispatch Support

<details>
<summary>Manual coverage reporting with issue number</summary>

```yaml
name: Manual Coverage Report
on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'Pull Request number'
        required: true
        type: string

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run tests with coverage
        run: npx jest --coverage --coverageReporters json-summary
      - name: Jest Coverage Comment
        uses: MishaKav/jest-coverage-comment@main
        with:
          issue-number: ${{ github.event.inputs.pr_number }}
```

**Usage**: Manually trigger this workflow and provide a PR number to get coverage comments on that specific pull request.

**Output**: Coverage comment will be posted to the specified pull request, even when not triggered by the PR itself.

</details>

### Changed Files Only

<details>
<summary>Show coverage only for files changed in the PR</summary>

```yaml
- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    report-only-changed-files: true
    title: Coverage for Changed Files
```

**Output**:

- **In PR**: Shows coverage only for files modified in the PR
- **No changes**: Shows message "_report-only-changed-files is enabled. No files were changed in this commit :)_"

**Note**: Only works with `pull_request` and `push` events.

</details>

### Auto-Update README Badge

<details>
<summary>Update coverage badge in README without commits</summary>

```yaml
name: Update Coverage Badge
on:
  push:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -- --coverage

      - name: Jest Coverage Comment
        id: coverage
        uses: MishaKav/jest-coverage-comment@main
        with:
          hide-comment: true

      - name: Dynamic Badges
        if: github.ref == 'refs/heads/main'
        uses: Schneegans/dynamic-badges-action@v1.7.0
        with:
          auth: ${{ secrets.GIST_SECRET }}
          gistID: your-gist-id-here
          filename: coverage.json
          label: Coverage
          message: ${{ steps.coverage.outputs.coverage }}%
          color: ${{ steps.coverage.outputs.color }}
```

</details>

## 🔬 Advanced Features

<details>
<summary>📊 Using Output Variables</summary>

```yaml
- name: Jest Coverage Comment
  id: coverage
  uses: MishaKav/jest-coverage-comment@main

- name: Dynamic Badges
  uses: Schneegans/dynamic-badges-action@v1.7.0
  with:
    auth: ${{ secrets.GIST_SECRET }}
    gistID: your-gist-id
    filename: coverage.json
    label: Coverage
    message: ${{ steps.coverage.outputs.coverage }}%
    color: ${{ steps.coverage.outputs.color }}

- name: Fail if coverage too low
  if: ${{ steps.coverage.outputs.coverage < 80 }}
  run: |
    echo "Coverage is below 80%!"
    exit 1
```

</details>

<details>
<summary>⚡ Performance Optimization</summary>

For large coverage reports that might exceed GitHub's comment size limits:

```yaml
- name: Jest Coverage Comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    hide-summary: true # Show only badge and test results
    report-only-changed-files: true # Only show changed files
    remove-links-to-files: true # Remove clickable file links
    remove-links-to-lines: true # Remove clickable line number links
```

**Link Removal Options:**

- `remove-links-to-files: true` - Removes clickable links to files. Instead of `[example.js](link)`, shows plain `example.js`
- `remove-links-to-lines: true` - Removes clickable links to line numbers. Instead of `[14-18](link)`, shows plain `14-18`

These options significantly reduce comment size while preserving all coverage information.

</details>

## 🎨 Badge Colors

Coverage badges automatically change color based on the percentage:

| Coverage | Badge                                                                           | Color        |
| -------- | ------------------------------------------------------------------------------- | ------------ |
| 0-40%    | ![Coverage 0-40](https://img.shields.io/badge/Coverage-20%25-red.svg)           | Red          |
| 40-60%   | ![Coverage 40-60](https://img.shields.io/badge/Coverage-50%25-orange.svg)       | Orange       |
| 60-80%   | ![Coverage 60-80](https://img.shields.io/badge/Coverage-70%25-yellow.svg)       | Yellow       |
| 80-90%   | ![Coverage 80-90](https://img.shields.io/badge/Coverage-85%25-green.svg)        | Green        |
| 90-100%  | ![Coverage 90-100](https://img.shields.io/badge/Coverage-95%25-brightgreen.svg) | Bright Green |

## 📸 Result Examples

<details>
<summary>View example outputs</summary>

### Complete Comment Example

> <!-- Jest Coverage Comment: jest-coverage-comment -->
>
> # My Jest Coverage Comment
>
> ## My Summary Title
>
> | Lines                                                                                                                                                                                                               | Statements     | Branches     | Functions  |
> | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | ---------- |
> | <a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/README.md"><img alt="Coverage: 78%" src="https://img.shields.io/badge/Coverage-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 33.33% (2/6) | 100% (0/0) |
>
> ## My JUnit Title
>
> | Tests | Skipped | Failures | Errors   | Time               |
> | ----- | ------- | -------- | -------- | ------------------ |
> | 6     | 0 :zzz: | 0 :x:    | 0 :fire: | 1.032s :stopwatch: |
>
> <details><summary>My Coverage Title (<b>78%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>76.74</b></td><td><b>100</b></td><td><b>33.33</b></td><td><b>78.57</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>75.67</td><td>100</td><td>40</td><td>75.67</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/controller.js">controller.js</a></td><td>63.63</td><td>100</td><td>50</td><td>63.63</td><td><a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/controller.js#L14-L18">14&ndash;18</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/index.js">index.js</a></td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td><a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/index.js#L9">9</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/router.js">router.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/service.js">service.js</a></td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td><a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/service.js#L16-L20">16&ndash;20</a></td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/utils/utils.js">utils.js</a></td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>

### Text Mode Example

With `text-instead-badge: true`:

> | Lines          | Statements     | Branches     | Functions  |
> | -------------- | -------------- | ------------ | ---------- |
> | 78.57% (33/42) | 76.74% (33/43) | 33.33% (2/6) | 100% (0/0) |

### Coverage Summary Report

![Summary Report](https://user-images.githubusercontent.com/289035/161067781-b162f85f-5ff4-4e00-b0f9-e487b3a10f9f.png)

### Coverage Console Report

![Coverage Report](https://user-images.githubusercontent.com/289035/161068864-25d8878a-2c82-4f83-b7dc-70a5a955b877.png)

### JUnit Test Report

![JUnit Report](https://user-images.githubusercontent.com/289035/161068120-303b47a9-c8e2-4fa6-80db-21aefbf9033b.png)

### Multiple Files (Monorepo)

![Multiple Files Coverage](https://user-images.githubusercontent.com/289035/183769452-99e53ad9-5205-44b7-bba6-c8d481ce5cc4.png)

![Multiple Files JUnit](https://user-images.githubusercontent.com/289035/195997703-95d331a3-beba-4567-831e-22d1f0e977da.png)

</details>

## 🔧 Troubleshooting

<details>
<summary>Common Issues and Solutions</summary>

### Comment Not Appearing

**Problem**: The action runs successfully but no comment appears on the PR.

**Solutions**:

- Ensure proper permissions are set:
  ```yaml
  permissions:
    contents: read
    pull-requests: write
  ```
- Check if `hide-comment` is set to `false`
- Verify the action is running on supported events (`pull_request`, `push`, `workflow_dispatch`, `workflow_run`)
- For `workflow_dispatch` or `workflow_run` events, ensure `issue-number` input is provided

### Coverage Report Too Large

**Problem**: "Comment is too long (maximum is 65536 characters)"

**Solutions**:

- Use `report-only-changed-files: true`
- Set `hide-summary: true` to show only badge
- Use `remove-links-to-files: true` to remove clickable file links
- Use `remove-links-to-lines: true` to remove clickable line number links
- Use `["text-summary", { "skipFull": true }]` in Jest coverage reporters to skip fully covered files

### Coverage Shows 0%

**Problem**: Jest not collecting coverage for your files

**Solutions**:

```javascript
// Check collectCoverageFrom in jest.config.js
collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.test.{js,ts}']
```

### Files Not Found

**Problem**: "No such file or directory" errors

**Solutions**:

- Use absolute paths or paths relative to `$GITHUB_WORKSPACE`
- Check that coverage files are generated before the action runs
- Verify Jest configuration generates required files

### Wrong File Links

**Problem**: Links in the coverage report point to wrong files or 404

**Solutions**:

- Use `coverage-path-prefix` if your test paths differ from repository structure
- Ensure the action runs on the correct commit SHA

### Workflow Dispatch Events

**Problem**: Need to trigger coverage reporting on specific PRs manually

**Solutions**:

- Use `issue-number` input to specify the target PR:
  ```yaml
  - name: Jest Coverage Comment
    uses: MishaKav/jest-coverage-comment@main
    with:
      issue-number: 123 # Replace with actual PR number
  ```
- For `workflow_dispatch`, add input parameter:
  ```yaml
  on:
    workflow_dispatch:
      inputs:
        pr_number:
          description: 'Pull Request number'
          required: true
  ```

</details>

## 🤝 Contributing

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

We welcome all contributions! Please feel free to submit [pull requests](https://github.com/MishaKav/jest-coverage-comment/pulls) or open [issues](https://github.com/MishaKav/jest-coverage-comment/issues) for bugs, feature requests, or improvements.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/MishaKav/jest-coverage-comment.git
cd jest-coverage-comment

# Install dependencies
npm install

# Run tests
npm test

# Build the action
npm run build

# Package for distribution
npm run package
```

## 👥 Contributors

<a href="https://github.com/MishaKav/jest-coverage-comment/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=MishaKav/jest-coverage-comment" alt="Contributors" />
</a>

## 📄 License

MIT © [Misha Kav](https://github.com/MishaKav)

---

## 🔗 Similar Actions

**For Python projects using pytest:**
Check out [pytest-coverage-comment](https://github.com/marketplace/actions/pytest-coverage-comment) - a similar action for Python test coverage with pytest.

---

<div align="center">

**If you find this action helpful, please consider giving it a ⭐ on [GitHub](https://github.com/MishaKav/jest-coverage-comment)!**

</div>
