# Jest Coverage Comment

![Auto Updating Bagde](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/MishaKav/5e90d640f8c212ab7bbac38f72323f80/raw/jest-coverage-comment__main.json)
![licience](https://img.shields.io/github/license/MishaKav/jest-coverage-comment)
![version](https://img.shields.io/github/package-json/v/MishaKav/jest-coverage-comment)
[![wakatime](https://wakatime.com/badge/user/f838c8aa-c197-42f0-b335-cd1d26159dfd/project/9b2410f3-4104-44ec-bd7f-8d2553a31ffb.svg)](https://wakatime.com/badge/user/f838c8aa-c197-42f0-b335-cd1d26159dfd/project/9b2410f3-4104-44ec-bd7f-8d2553a31ffb)

This action comments a pull request or commit with a HTML test coverage report.
The report is based on the coverage report generated by your jest test runner.
Note that this action does not run any tests, but expects the tests to have been run by another action already (npx jest).

You can add this action to your GitHub workflow for Ubuntu runners (e.g. runs-on: ubuntu-latest) as follows:

```yaml
- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
```

## Inputs

| Name                    | Required | Default                            | Description                                                                                            |
| ----------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `github-token`          | ✓        | `${{github.token}}`                | An alternative GitHub token, other than the default provided by GitHub Actions runner                  |
| `coverage-summary-path` |          | `./coverage/coverage-summary.json` | The location of the coverage-summary of jest                                                           |
| `title`                 |          | ''                                 | Main title for the comment                                                                             |
| `summary-title`         |          | ''                                 | Title for the coverage summary                                                                         |
| `badge-title`           |          | `Coverage`                         | Title for the badge icon                                                                               |
| `hide-summary`          |          | false                              | Hide coverage summary report                                                                           |
| `create-new-comment`    |          | false                              | When false, will update the same comment, otherwise will publish new comment on each run.              |
| `hide-comment`          |          | false                              | Hide the whole comment (use when you need only the `output`). Useful for auto-update bagdes in readme. |
| `junitxml-path`         |          | ''                                 | The location of the junitxml path (npm package `jest-junit` should be installed)                       |
| `junitxml-title`        |          | ''                                 | Title for summary for junitxml                                                                         |
| `coverage-path`         |          | ''                                 | The location of the coverage.txt (jest console output)                                                 |
| `coverage-title`        |          | ''                                 | Title for the coverage report                                                                          |

## Output Variables

| Name          | Example | Description                                                                           |
| ------------- | ------- | ------------------------------------------------------------------------------------- |
| `coverage`    | 78      | Percentage of the coverage, get from `coverage-summary.json`                          |
| `color`       | yellow  | Color of the percentage. You can see the whole list of [badge colors](#badges-colors) |
| `summaryHtml` | ...     | Markdown table with coverage summary. See the [output-example](#output-example)       |
| `tests`       | 9       | Total number of tests, get from `junitxml`                                            |
| `skipped`     | 0       | Total number of skipped tests, get from `junitxml`                                    |
| `failures`    | 0       | Total number of tests with failures, get from `junitxml`                              |
| `errors`      | 0       | Total number of tests with errors, get from `junitxml`                                |
| `time`        | 2.883   | Seconds the took to run all the tests, get from `junitxml`                            |

## Output example

| Lines                                                                                                                                                                                                                    | Statements     | Branches     | Functions  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------ | ---------- |
| <a href="https://github.com/MishaKav/api-testing-example/blob/8e4041e07d7b5639c06bf245637abb6a55f3a694/README.md"><img alt="Jest Coverage" src="https://img.shields.io/badge/Jest Coverage-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 33.33% (2/6) | 100% (0/0) |

| Tests | Skipped | Failures | Errors   | Time               |
| ----- | ------- | -------- | -------- | ------------------ |
| 9     | 0 :zzz: | 0 :x:    | 0 :fire: | 2.709s :stopwatch: |

## Example usage

The following is an example GitHub Action workflow that uses the Jest Coverage Comment to extract the coverage summary to comment at pull request:

```yaml
# This workflow will install dependencies, create coverage tests and run Jest Coverage Comment
# For more information see: https://github.com/MishaKav/jest-coverage-comment/
name: Jest coverage comment
on:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npx jest --coverage --config='{ "coverageReporters": ["json-summary"] }'

      - name: Jest coverage comment
        uses: MishaKav/jest-coverage-comment@main
```

Example GitHub Action workflow that uses coverage percentage as output and update badge on Readme.md without commits to repo (see the [live workflow](../main/.github/workflows/update-coverage-on-readme.yml))

```yaml
name: Update Coverage on Readme
on:
  push:

jobs:
  update-coverage-on-readme:
    name: Update Coverage on Readme
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Jest coverage comment
        id: coverageComment
        uses: MishaKav/jest-coverage-comment@main
        with:
          hide-comment: true
          coverage-summary-path: ./coverage/coverage-summary.json

      - name: Check the output coverage
        run: |
          echo "Coverage Percantage - ${{ steps.coverageComment.outputs.coverage }}"
          echo "Coverage Color - ${{ steps.coverageComment.outputs.color }}"
          echo "Summary Html - ${{ steps.coverageComment.outputs.summaryHtml }}"

      - name: Create the Badge
            if: ${{ github.ref == 'refs/heads/main' }}
        uses: schneegans/dynamic-badges-action@v1.0.0
        with:
          auth: ${{ secrets.JEST_COVERAGE_COMMENT }}
          gistID: 5e90d640f8c212ab7bbac38f72323f80
          filename: jest-coverage-comment__main.json
          label: Coverage
          message: ${{ steps.coverageComment.outputs.coverage }}%
          color: ${{ steps.coverageComment.outputs.color }}
          namedLogo: javascript
```

Example GitHub Action workflow that passes all params to Jest Coverage Comment

```yaml
- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    coverage-summary-path: ./coverage/coverage-summary.json
    title: Jest Coverage Comment
    summary-title: Summary
    badge-title: Jest Coverage
    hide-comment: false
    create-new-comment: false
    hide-summary: false
    junitxml-path: ./coverage/junit.xml
    junitxml-title: Junit
```

![image](https://user-images.githubusercontent.com/289035/159379926-82491965-3f06-4116-907f-8f34353c208f.png)

Example GitHub Action workflow that generate Junit report from `junit.xml`

- you should install `jest-junit` package, and add the following entry in your jest config `jest.config.js`:

```json
{
  "reporters": ["default", "jest-junit"]
}
```

- or you can provide it directly to `jest` like `jest --reporters=default --reporters=jest-junit`

```yaml
- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    junitxml-path: ./junit.xml
    junitxml-title: Junit
```

Example GitHub Action workflow that will update your `README.md` with coverage summary, only on merge to `main` branch
All you need is to add in your `README.md` the following lines wherever you want.
If your coverage summary report will not change, it wouldn't push any changes to readme file.

```html
<!-- Jest Coverage Comment:Begin -->
<!-- Jest Coverage Comment:End -->
```

```yaml
name: Update Coverage on Readme
on:
  push:
    branches:
      - main
jobs:
  update-coverage-on-readme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          persist-credentials: false # otherwise, the token used is the GITHUB_TOKEN, instead of your personal token
          fetch-depth: 0 # otherwise, you will failed to push refs to dest repo

      - name: Jest coverage comment
        if: ${{ github.ref == 'refs/heads/main' }}
        id: coverageComment
        uses: MishaKav/jest-coverage-comment@main
        with:
          hide-summary: true
          coverage-summary-path: ./coverage/coverage-summary.json

      - name: Update Readme with Coverage Html
        if: ${{ github.ref == 'refs/heads/main' }}
        run: |
          sed -i '/<!-- Jest Coverage Comment:Begin -->/,/<!-- Jest Coverage Comment:End -->/c\<!-- Jest Coverage Comment:Begin -->\n\${{ steps.coverageComment.outputs.summaryHtml }}\n<!-- Jest Coverage Comment:End -->' ./README.md

      - name: Commit & Push changes to Readme
        if: ${{ github.ref == 'refs/heads/main' }}
        uses: actions-js/push@master
        with:
          message: Update coverage on Readme
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Badges colors

![Coverage 0-40](https://img.shields.io/badge/Coverage-20%25-red.svg) [0, 40]

![Coverage 40-60](https://img.shields.io/badge/Coverage-50%25-orange.svg) [40, 60]

![Coverage 60-80](https://img.shields.io/badge/Coverage-70%25-yellow.svg) [60, 80]

![Coverage 80-90](https://img.shields.io/badge/Coverage-85%25-green.svg) [80, 90]

![Coverage 90-100](https://img.shields.io/badge/Coverage-95%25-brightgreen.svg) [90, 100]

## Auto updating badge on README

If you want auto-update the coverage badge on your Readme, you can see the [workflow](../main/.github/workflows/update-coverage-on-readme.yml)
![Auto Updating Bagde](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/MishaKav/5e90d640f8c212ab7bbac38f72323f80/raw/jest-coverage-comment__main.json)

## 🤝 Contributing [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

We welcome all contributions. You can submit any ideas as [pull requests](https://github.com/MishaKav/jest-coverage-comment/pulls) or as [GitHub issues](https://github.com/MishaKav/jest-coverage-comment/issues) and have a good time! :)

## Our Contibutors

<a href="https://github.com/MishaKav/jest-coverage-comment/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=MishaKav/jest-coverage-comment" alt="Contibutors" />
</a>
