module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setupDatabase.js'],
  collectCoverageFrom: ['services/**/*.js', 'repositories/**/*.js', 'routes/**/*.js', 'middleware/**/*.js', 'utils/**/*.js', 'db/**/*.js'],
  coverageReporters: ['text', 'html', 'json-summary', 'lcov'],
  testTimeout: 20000,
};
