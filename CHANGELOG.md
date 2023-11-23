# Changelog of the Jest Coverage Comment

## [Jest Coverage Comment 1.0.24](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.24)

**Release Date:** 2023-11-23

#### Changes

- Take right `serverUrl` in non github.com environments like selfhosted github, e.g. link to lines uses then the correct link, thanks to [@c0un7-z3r0](https://github.com/c0un7-z3r0) for contribution

## [Jest Coverage Comment 1.0.23](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.23)

**Release Date:** 2023-03-13

#### Changes

- Remove summary error in annotations when provide one of `junitxml-path / coverage-path / multiple-files / multiple-junitxml-files` and not provide `coverage-summary-path` which have default value

## [Jest Coverage Comment 1.0.22](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.22)

**Release Date:** 2023-01-07

#### Changes

- Support `pull_request_target` event to add comments, thanks to [@chirag-madlani](https://github.com/chirag-madlani) for contribution

## [Jest Coverage Comment 1.0.21](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.21)

**Release Date:** 2022-12-03

#### Changes

- Support matrix with individual comments. When you run in a matrix, and you want that every job will post a comment, you can use the `unique-id-for-comment: ${{ matrix.node-version }}`. This will post a comment for every job, and will update them on every run.

## [Jest Coverage Comment 1.0.20](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.20)

**Release Date:** 2022-10-31

#### Changes

- Huge thanks to [@paescuj](https://github.com/paescuj) for contribution. Many internal things such:
  - Consistent usage of terms and letter casing
  - Fix typos and enhance formatting in `README.md`
  - Use single quotes whenever possible
  - Use [JSDoc](https://jsdoc.app) to describe the functions, so the descriptions are displayed in IDE

## [Jest Coverage Comment 1.0.19](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.19)

**Release Date:** 2022-10-20

#### Changes

- Fix failing the action when the event type is not `pull_request`/`push`. Now it will just post `warning` message if you try to comment (and not fail the whole action). If you just using an `output` of the action you will be able to run this action on events like `schedule`/`workflow_dispatch` etc
- Add full `CHANGELOG.md` (current file with all history). Those whos use `dependabot` now will be able to see the changes directly in the PR

## [Jest Coverage Comment 1.0.18](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.18)

**Release Date:** 2022-10-15

#### Changes

- Support multiple junitxml files

```yaml
- name: Jest coverage comment
  uses: MishaKav/jest-coverage-comment@main
  with:
    multiple-junitxml-files: |
      My-Title-1, ./coverage_1/junit.xml
      My-Title-2, ./coverage_2/junit.xml
```

![image](https://user-images.githubusercontent.com/289035/195997703-95d331a3-beba-4567-831e-22d1f0e977da.png)

## [Jest Coverage Comment 1.0.17](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.17)

**Release Date:** 2022-10-15

#### Changes

- Fix errors for old junit format
  old versions like 10 of `jest-junit` do not provide a summary for the `errors` field. Calculate it manually.

## [Jest Coverage Comment 1.0.16](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.16)

**Release Date:** 2022-10-13

#### Changes

- Fix error when reading coverage txt
- Improve warnings when a comment is too long
- Remove unrelevant suggestions from the warning

## [Jest Coverage Comment 1.0.15](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.15)

**Release Date:** 2022-09-10

#### Changes

- Swap branch and functions (typo)

## [Jest Coverage Comment 1.0.14](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.14)

**Release Date:** 2022-08-19

#### Changes

- Add ability to remove links from report
  add new properties:
  - remove-links-to-files
  - remove-links-to-lines

it will significantly reduce comment length which is useful in large reports

![image](https://user-images.githubusercontent.com/289035/185572824-44782b8e-e2ef-42a3-b06a-5b16e969a9d5.png)

## [Jest Coverage Comment 1.0.13](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.13)

**Release Date:** 2022-08-10

#### Changes

- Add support for `istanbul` report (remove extra slash on folders)

## [Jest Coverage Comment 1.0.12](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.12)

**Release Date:** 2022-08-10

#### Changes

- support multiple files for mono repo projects
  ![image](https://user-images.githubusercontent.com/289035/183769452-99e53ad9-5205-44b7-bba6-c8d481ce5cc4.png)

## [Jest Coverage Comment 1.0.11](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.11)

**Release Date:** 2022-06-29

#### Changes

- fix changed files (when the first commit comes in `push` evnet, it fails to compare it with `head` commit)

## [Jest Coverage Comment 1.0.10](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.10)

**Release Date:** 2022-06-28

#### Changes

- remove strip colors

## [Jest Coverage Comment 1.0.9](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.9)

**Release Date:** 2022-06-17

#### Changes

- Prevent total line from being treated as folder + correct spellings
- Big thanks for @paescuj for the PR

## [Jest Coverage Comment 1.0.8](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.8)

**Release Date:** 2022-05-17

#### Changes

- Fix empty folders on changed files (the report show empty folders even they don't contain files)

## [Jest Coverage Comment 1.0.7](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.7)

**Release Date:** 2022-05-14

#### Changes

- Fix head of base commit, sometimes it fails the actions with error \
  `The head commit for this ${eventName} event is not ahead of the base commit. `

## [Jest Coverage Comment 1.0.6](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.6)

**Release Date:** 2022-04-27

#### Changes

- Add comment to report when no files changed: \ _report-only-changed-files is enabled. No files were changed during this commit :)_

## [Jest Coverage Comment 1.0.5](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.5)

**Release Date:** 2022-04-23

#### Changes

- show elapsed time in minutes when it's more than 60 seconds
- If the elapsed time is more than 1 minute, it will show it in a different format (`555.0532s` > `9m 15s`), the output format will be the same as `junit.xml` (`555.0532s`).

## [Jest Coverage Comment 1.0.4](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.4)

**Release Date:** 2022-04-01

#### Changes

- Report only changed files
  ![image](https://user-images.githubusercontent.com/289035/161164092-6e550fa1-9c3b-4b4b-8aa8-5fac9c0b7e96.png)

## [Jest Coverage Comment 1.0.3](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.3)

**Release Date:** 2022-03-31

#### Changes

- add full coverage report

![image](https://user-images.githubusercontent.com/289035/161070343-5b417cea-f2cf-45a1-a926-bab899904548.png)

## [Jest Coverage Comment 1.0.2](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.2)

**Release Date:** 2022-03-22

#### Changes

- add support for `junit.xml`

  ![image](https://user-images.githubusercontent.com/289035/159386186-ae896061-d34e-47a5-8a22-5dfeb5cc20ca.png)

## [Jest Coverage Comment 1.0.1](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.1)

**Release Date:** 2022-03-21

#### Changes

- Update main Readme, use the latest `@main` version instead `@v1` in the example workflows.

## [Jest Coverage Comment 1.0.0](https://github.com/MishaKav/jest-coverage-comment/tree/v1.0.0)

**Release Date:** 2022-03-21

#### Changes

- Initial publication on GitHub. The first release of the action. The main idea based on [Pytest Coverage Comment](https://github.com/marketplace/actions/pytest-coverage-comment)
