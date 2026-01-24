/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@autograder/database$': '<rootDir>/../../packages/database/src',
  },
  setupFilesAfterEnv: ['<rootDir>/setup-e2e.ts'],
  testTimeout: 60000,
  verbose: true,
  // Run tests sequentially to avoid database conflicts
  maxWorkers: 1,
};
