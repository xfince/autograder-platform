/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/index.ts',
    '!src/**/*.guard.ts',
    '!src/**/*.decorator.ts',
    '!src/**/*.filter.ts',
    '!src/**/*.interceptor.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@autograder/database$': '<rootDir>/../../packages/database/src',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  // Coverage thresholds - Phase 1: 10% (bootstrap testing infrastructure)
  // Phase 2: 30% (service tests), Phase 3: 50% (full coverage)
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 8,
      lines: 10,
      statements: 10,
    },
  },
  testTimeout: 30000,
  verbose: true,
};
