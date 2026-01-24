/**
 * E2E Test Setup
 * Runs before each E2E test suite
 */

// Set test environment variables for E2E tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e-test-jwt-secret-key';
process.env.JWT_EXPIRATION = '1h';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://autograder:autograder123@localhost:5432/autograder_test';

// Increase timeout for E2E tests
jest.setTimeout(60000);
