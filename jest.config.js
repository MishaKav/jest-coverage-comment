module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageReporters: [
    //   'clover',
    //   'json',
    'json-summary',
    'text',
    'text-summary',
    //   'lcov',
  ],
  verbose: true,
}
