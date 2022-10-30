// Turn off stdout in tests, so console doesn't get polluted by it and core output isn't interpreted in CI
process.stdout.write = () => {
  return false
}

module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    'src/cli.ts',
    'src/types.d.ts',
    'src/index.ts',
    'src/create-comment.ts',
    'src/changed-files.ts',
  ],
  coverageReporters: [
    //   'clover',
    //   'json',
    'html',
    'json-summary',
    'text',
    'text-summary',
    //   'lcov',
  ],
  reporters: ['default', ['jest-junit', { outputDirectory: 'coverage' }]],
  verbose: true,
}
