# Jest Coverage Comment

![Auto Updating Bagde](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/MishaKav/5e90d640f8c212ab7bbac38f72323f80/raw/jest-coverage-comment__main.json)
![licience](https://img.shields.io/github/license/MishaKav/jest-coverage-comment)
![version](https://img.shields.io/github/package-json/v/MishaKav/jest-coverage-comment)
[![wakatime](https://wakatime.com/badge/user/f838c8aa-c197-42f0-b335-cd1d26159dfd/project/9b2410f3-4104-44ec-bd7f-8d2553a31ffb.svg)](https://wakatime.com/badge/user/f838c8aa-c197-42f0-b335-cd1d26159dfd/project/9b2410f3-4104-44ec-bd7f-8d2553a31ffb)

This action comments a pull request or commit with a HTML test coverage report.
The report is based on the coverage report generated by your jest test runner.
Note that this action does not run any tests, but expects the tests to have been run by another action already (npx jest).

**Similar Action for Pytest**

---

I made this action after I see that similar action for python that runs `pytest` became very popular
[pytest-coverage-comment](https://github.com/marketplace/actions/pytest-coverage-comment)

---

You can add this action to your GitHub workflow for Ubuntu runners (e.g. `runs-on: ubuntu-latest`) as follows:

```yaml
- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
```

## Inputs

| Name                        | Required | Default                            | Description                                                                                                                                                                                          |
| --------------------------- | -------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `github-token`              | ✓        | `${{github.token}}`                | An alternative GitHub token, other than the default provided by GitHub Actions runner                                                                                                                |
| `coverage-summary-path`     |          | `./coverage/coverage-summary.json` | The location of the coverage-summary of jest                                                                                                                                                         |
| `title`                     |          | ''                                 | Main title for the comment                                                                                                                                                                           |
| `summary-title`             |          | ''                                 | Title for the coverage summary                                                                                                                                                                       |
| `badge-title`               |          | `Coverage`                         | Title for the badge icon                                                                                                                                                                             |
| `hide-summary`              |          | false                              | Hide coverage summary report                                                                                                                                                                         |
| `create-new-comment`        |          | false                              | When false, will update the same comment, otherwise will publish new comment on each run.                                                                                                            |
| `hide-comment`              |          | false                              | Hide the whole comment (use when you need only the `output`). Useful for auto-update bagdes in readme.                                                                                               |
| `junitxml-path`             |          | ''                                 | The location of the junitxml path (npm package `jest-junit` should be installed)                                                                                                                     |
| `junitxml-title`            |          | ''                                 | Title for summary for junitxml                                                                                                                                                                       |
| `coverage-path`             |          | ''                                 | The location of the coverage.txt (jest console output)                                                                                                                                               |
| `coverage-title`            |          | `Coverage Report`                  | Title for the coverage report                                                                                                                                                                        |
| `coverage-path-prefix`      |          | ''                                 | Prefix for path when link to files in comment                                                                                                                                                        |
| `report-only-changed-files` |          | false                              | Show in report only changed files for this commit, and not all files                                                                                                                                 |
| `multiple-files`            |          | ''                                 | You can pass array of `json-summary.json` files and generate single comment with table of results<br/>**Note:** In that mode the `output` for `coverage` and `color` will be for the first file only |

## Output Variables

| Name           | Example | Description                                                                           |
| -------------- | ------- | ------------------------------------------------------------------------------------- |
| `coverage`     | 78      | Percentage of the coverage, get from `coverage-summary.json`                          |
| `color`        | yellow  | Color of the percentage. You can see the whole list of [badge colors](#badges-colors) |
| `summaryHtml`  | ...     | Markdown table with summary. See the [output-example](#output-example)                |
| `tests`        | 9       | Total number of tests, get from `junitxml`                                            |
| `skipped`      | 0       | Total number of skipped tests, get from `junitxml`                                    |
| `failures`     | 0       | Total number of tests with failures, get from `junitxml`                              |
| `errors`       | 0       | Total number of tests with errors, get from `junitxml`                                |
| `time`         | 2.883   | Seconds the took to run all the tests, get from `junitxml`                            |
| `lines`        | 71      | Lines covered, get from jest text report                                              |
| `branches`     | 100     | Branches covered, get from jest text report                                           |
| `functions`    | 28      | Functions covered, get from jest text report                                          |
| `statements`   | 100     | Statements covered, get from jest text report                                         |
| `coverageHtml` | ...     | Markdown table with coverage summary. See the [output-example](#output-example)       |

## Output example

<!-- Jest Coverage Comment: jest-coverage-comment -->

# My Jest Coverage Comment

## My Summary Title

| Lines                                                                                                                                                                                                               | Statements     | Branches     | Functions  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | ---------- |
| <a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/README.md"><img alt="Coverage: 78%" src="https://img.shields.io/badge/Coverage-78%25-yellow.svg" /></a><br/> | 76.74% (33/43) | 33.33% (2/6) | 100% (0/0) |

## My Junit Title

| Tests | Skipped | Failures | Errors   | Time               |
| ----- | ------- | -------- | -------- | ------------------ |
| 6     | 0 :zzz: | 0 :x:    | 0 :fire: | 1.032s :stopwatch: |

<details><summary>My Coverage Title (<b>78%</b>)</summary><table><tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr><tbody><tr><td><b>All files</b></td><td><b>76.74</b></td><td><b>100</b></td><td><b>33.33</b></td><td><b>78.57</b></td><td>&nbsp;</td></tr><tr><td>src</td><td>75.67</td><td>100</td><td>40</td><td>75.67</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/controller.js">controller.js</a></td><td>63.63</td><td>100</td><td>50</td><td>63.63</td><td><a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/controller.js#L14-L18">14&ndash;18</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/index.js">index.js</a></td><td>85.71</td><td>100</td><td>0</td><td>85.71</td><td><a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/index.js#L9">9</a></td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/router.js">router.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/service.js">service.js</a></td><td>69.23</td><td>100</td><td>50</td><td>69.23</td><td><a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/service.js#L16-L20">16&ndash;20</a></td></tr><tr><td>src/utils</td><td>83.33</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/utils/config.js">config.js</a></td><td>100</td><td>100</td><td>100</td><td>100</td><td>&nbsp;</td></tr><tr><td>&nbsp; &nbsp;<a href="https://github.com/MishaKav/api-testing-example/blob/725508e4be6d3bc9d49fa611bd9fba96d5374a13/src/utils/utils.js">utils.js</a></td><td>75</td><td>100</td><td>0</td><td>100</td><td>&nbsp;</td></tr></tbody></table></details>

## Example Usage

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
          npx jest --coverage --coverageReporters json-summary

      - name: Jest coverage comment
        uses: MishaKav/jest-coverage-comment@main
```

Example GitHub Action workflow that uses coverage percentage as output and update badge on README.md without commits to repo (see the [live workflow](../main/.github/workflows/update-coverage-on-readme.yml))

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
    title: My Jest Coverage Comment
    summary-title: My Summary Title
    badge-title: Coverage
    hide-comment: false
    create-new-comment: false
    hide-summary: false
    junitxml-title: My Junit Title
    junitxml-path: ./coverage/junit.xml
    coverage-title: My Coverage Title
    coverage-path: ./coverage.txt
```

![image](https://user-images.githubusercontent.com/289035/161066760-40876696-c2cc-432a-9a7c-0952239941f3.png)

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

### Summary Report

Generated from `json-summary`

![image](https://user-images.githubusercontent.com/289035/161067781-b162f85f-5ff4-4e00-b0f9-e487b3a10f9f.png)

```yaml
- name: Run tests
  run: |
    npx jest --coverage --reporters=default --reporters=jest-junit'

- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    coverage-summary-path: ./coverage/coverage-summary.json
```

### Coverage Report

Generated from jest output by writing the output to file `| tee ./coverage.txt`
The nice thing, is that will link all your files inside that commit and ability to click by missing lines and go inside file directly to missing lines

![image](https://user-images.githubusercontent.com/289035/161068864-25d8878a-2c82-4f83-b7dc-70a5a955b877.png)

```yaml
- name: Run tests
  run: |
    npx jest --coverage | tee ./coverage.txt

- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    coverage-path: ./coverage.txt
```

### Junit Report

Generated from `junit.xml` by [jest-junit](https://www.npmjs.com/package/jest-junit)

- If the elapsed time is more than 1 minute, it will show it in a different format (`555.0532s` > `9m 15s`), the output format will be the same as `junit.xml` (`555.0532s`).

  ![image](https://user-images.githubusercontent.com/289035/161068120-303b47a9-c8e2-4fa6-80db-21aefbf9033b.png)

```yaml
- name: Run tests
  run: |
    npx jest --coverage --config='{ "coverageReporters": ["json-summary"] }'

- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    junitxml-path: ./junit.xml
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

## Our Contributors

<a href="https://github.com/MishaKav/jest-coverage-comment/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=MishaKav/jest-coverage-comment" alt="Contributors" />
</a>
