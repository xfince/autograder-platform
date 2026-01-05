/**
 * tests/backend/error-handling.test.js
 *
 * Tests for error handling and edge cases
 * Evaluates: Criterion 3 (Back-End Architecture) & Criterion 13 (Security)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');

const TEST_TIMEOUT = 30000;
let app;
let server;

describe('Error Handling Tests', () => {
  let testResults = {
    criterion_id: 'criterion_3',
    subsection: 'error_handling',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
  };

  beforeAll(async () => {
    try {
      // Load student's app (check grading-folder first, then root)
      const possiblePaths = [
        path.join(process.cwd(), 'grading-folder', 'backend', 'server.js'),
        path.join(process.cwd(), 'grading-folder', 'backend', 'app.js'),
        path.join(process.cwd(), 'grading-folder', 'backend', 'index.js'),
        path.join(process.cwd(), 'grading-folder', 'server', 'server.js'),
        path.join(process.cwd(), 'grading-folder', 'server', 'index.js'),
        path.join(process.cwd(), 'server', 'index.js'),
        path.join(process.cwd(), 'server', 'server.js'),
        path.join(process.cwd(), 'backend', 'index.js'),
        path.join(process.cwd(), 'backend', 'server.js'),
      ];

      for (const appPath of possiblePaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(appPath)) {
            app = require(appPath);
            if (app.app) app = app.app;
            if (app.server) server = app.server;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      // Connect to test database
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
      }
    } catch (error) {
      console.error('Setup error:', error.message);
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    try {
      if (server && server.close) {
        await new Promise((resolve) => server.close(resolve));
      }

      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }

      console.log(JSON.stringify(testResults, null, 2));
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }, TEST_TIMEOUT);

  const recordTest = (testName, passed, error = null) => {
    testResults.total_tests++;
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    testResults.details.push({
      test: testName,
      passed,
      error: error ? error.message : null,
    });
  };

  describe('404 Not Found Handling', () => {
    test('Server returns 404 for non-existent routes', async () => {
      if (!app) {
        recordTest('404 handling', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app).get('/api/this-route-does-not-exist-at-all');

        expect(response.status).toBe(404);
        recordTest('404 handling', true);
      } catch (error) {
        recordTest('404 handling', false, error);
        throw error;
      }
    });

    test('404 response includes helpful error message', async () => {
      if (!app) {
        recordTest('404 error message', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app).get('/api/nonexistent-endpoint');

        if (response.status === 404) {
          const hasMessage =
            response.body && (response.body.error || response.body.message || response.body.msg);

          expect(hasMessage).toBe(true);
          recordTest('404 error message', true);
        } else {
          recordTest('404 error message', false, new Error('No 404 response'));
        }
      } catch (error) {
        recordTest('404 error message', false, error);
        throw error;
      }
    });
  });

  describe('400 Bad Request Handling', () => {
    test('Server returns 400 for malformed JSON', async () => {
      if (!app) {
        recordTest('Malformed JSON handling', false, new Error('App not loaded'));
        return;
      }

      try {
        // Send intentionally malformed JSON
        const response = await request(app)
          .post('/api/users')
          .send('{"invalid": json}')
          .set('Content-Type', 'application/json');

        // Should return 400-level error
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        recordTest('Malformed JSON handling', true);
      } catch (error) {
        recordTest('Malformed JSON handling', false, error);
        throw error;
      }
    });

    test('Server validates required fields and returns 400', async () => {
      if (!app) {
        recordTest('Required field validation', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/users', '/api/posts', '/api/auth/register'];
        let validates = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint)
              .send({}) // Empty object - missing required fields
              .set('Content-Type', 'application/json');

            if (response.status >= 400 && response.status < 500) {
              validates = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(validates).toBe(true);
        recordTest('Required field validation', true);
      } catch (error) {
        recordTest('Required field validation', false, error);
        throw error;
      }
    });
  });

  describe('401 Unauthorized Handling', () => {
    test('Server returns 401 for missing authentication', async () => {
      if (!app) {
        recordTest('401 unauthorized handling', false, new Error('App not loaded'));
        return;
      }

      try {
        const protectedEndpoints = ['/api/users/me', '/api/profile', '/api/dashboard'];

        let returns401 = false;

        for (const endpoint of protectedEndpoints) {
          try {
            const response = await request(app).get(endpoint);

            if (response.status === 401 || response.status === 403) {
              returns401 = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(returns401).toBe(true);
        recordTest('401 unauthorized handling', true);
      } catch (error) {
        recordTest('401 unauthorized handling', false, error);
        throw error;
      }
    });

    test('Server returns 401 for invalid JWT token', async () => {
      if (!app) {
        recordTest('Invalid JWT handling', false, new Error('App not loaded'));
        return;
      }

      try {
        const protectedEndpoints = ['/api/users/me', '/api/profile'];
        let rejectsInvalidToken = false;

        for (const endpoint of protectedEndpoints) {
          try {
            const response = await request(app)
              .get(endpoint)
              .set('Authorization', 'Bearer invalid.jwt.token');

            if (response.status === 401 || response.status === 403) {
              rejectsInvalidToken = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(rejectsInvalidToken).toBe(true);
        recordTest('Invalid JWT handling', true);
      } catch (error) {
        recordTest('Invalid JWT handling', false, error);
        throw error;
      }
    });
  });

  describe('500 Internal Server Error Handling', () => {
    test('Server handles database connection errors gracefully', async () => {
      if (!app) {
        recordTest('Database error handling', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to access endpoint with invalid MongoDB ID
        const response = await request(app).get('/api/users/not-a-valid-mongo-id');

        // Should handle gracefully (not crash) - return 400 or 404
        expect(response.status).toBeDefined();
        expect(response.status).not.toBe(500);

        recordTest('Database error handling', true);
      } catch (error) {
        // If it throws, server might have crashed - that's bad
        recordTest('Database error handling', false, error);
        throw error;
      }
    });

    test('Server doesnt crash on unexpected errors', async () => {
      if (!app) {
        recordTest('Unexpected error handling', false, new Error('App not loaded'));
        return;
      }

      try {
        // Make multiple rapid requests to test stability
        const requests = [];
        for (let i = 0; i < 5; i++) {
          requests.push(request(app).get('/api/users'));
        }

        await Promise.all(requests);

        // If we get here, server didn't crash
        recordTest('Unexpected error handling', true);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Unexpected error handling', false, error);
        throw error;
      }
    });
  });

  describe('Error Response Structure', () => {
    test('All error responses follow consistent structure', async () => {
      if (!app) {
        recordTest('Consistent error structure', false, new Error('App not loaded'));
        return;
      }

      try {
        // Trigger different types of errors
        const errors = [];

        // 404 error
        const error404 = await request(app).get('/api/nonexistent');
        errors.push(error404);

        // 400 error
        const error400 = await request(app)
          .post('/api/users')
          .send({})
          .set('Content-Type', 'application/json');
        errors.push(error400);

        // 401 error
        const error401 = await request(app).get('/api/users/me');
        errors.push(error401);

        // Check if all errors have consistent structure
        let consistentStructure = true;
        let commonFields = null;

        for (const error of errors) {
          if (error.status >= 400 && error.body) {
            const fields = Object.keys(error.body);

            if (commonFields === null) {
              commonFields = fields;
            } else {
              // Check if similar fields exist
              const hasCommonPattern =
                (fields.includes('error') || fields.includes('message')) &&
                (commonFields.includes('error') || commonFields.includes('message'));

              if (!hasCommonPattern) {
                consistentStructure = false;
                break;
              }
            }
          }
        }

        expect(consistentStructure).toBe(true);
        recordTest('Consistent error structure', true);
      } catch (error) {
        recordTest('Consistent error structure', false, error);
        throw error;
      }
    });

    test('Error responses include status code in body', async () => {
      if (!app) {
        recordTest('Error status in body', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app).get('/api/nonexistent-route');

        if (response.status >= 400) {
          // Check if body includes status or statusCode
          const hasStatus = response.body && (response.body.status || response.body.statusCode);

          // This is good practice but not required
          recordTest('Error status in body', Boolean(hasStatus));
        } else {
          recordTest('Error status in body', false);
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest('Error status in body', false, error);
      }
    });
  });

  describe('Async Error Handling', () => {
    test('Server catches errors in async route handlers', async () => {
      if (!app) {
        recordTest('Async error catching', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to access endpoints that might have async operations
        const endpoints = ['/api/users', '/api/posts'];
        let handlesAsyncErrors = true;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app).get(endpoint).timeout(5000);

            // If we get a response (not timeout), async errors are handled
            if (!response) {
              handlesAsyncErrors = false;
              break;
            }
          } catch (err) {
            if (err.code === 'ECONNABORTED') {
              handlesAsyncErrors = false;
              break;
            }
          }
        }

        expect(handlesAsyncErrors).toBe(true);
        recordTest('Async error catching', true);
      } catch (error) {
        recordTest('Async error catching', false, error);
        throw error;
      }
    });
  });

  describe('Validation Error Messages', () => {
    test('Validation errors provide helpful messages', async () => {
      if (!app) {
        recordTest('Validation error messages', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app)
          .post('/api/users')
          .send({ email: 'invalid-email' })
          .set('Content-Type', 'application/json');

        if (response.status >= 400 && response.status < 500) {
          // Check if error message is helpful (not generic)
          const message =
            response.body?.error || response.body?.message || response.body?.msg || '';

          const isHelpful =
            message.length > 5 &&
            (message.toLowerCase().includes('email') ||
              message.toLowerCase().includes('required') ||
              message.toLowerCase().includes('invalid') ||
              message.toLowerCase().includes('validation'));

          recordTest('Validation error messages', isHelpful);
        } else {
          recordTest('Validation error messages', false);
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest('Validation error messages', false, error);
      }
    });
  });

  describe('Error Logging', () => {
    test('Errors are likely logged (console or file)', () => {
      // This is hard to test directly, but we can check if logging packages exist
      try {
        const fs = require('fs');
        const packageJsonPath =
          path.join(process.cwd(), 'grading-folder', 'backend', 'package.json') ||
          path.join(process.cwd(), 'package.json');

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          };

          const hasLogging =
            dependencies.winston ||
            dependencies.morgan ||
            dependencies.pino ||
            dependencies['express-winston'];

          recordTest('Error logging', Boolean(hasLogging));
        } else {
          recordTest('Error logging', false);
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest('Error logging', false, error);
      }
    });
  });

  describe('Edge Cases', () => {
    test('Server handles very large payloads appropriately', async () => {
      if (!app) {
        recordTest('Large payload handling', false, new Error('App not loaded'));
        return;
      }

      try {
        // Create a large payload (but not too large to crash the test)
        const largeData = {
          data: 'x'.repeat(1000000), // 1MB of data
        };

        const response = await request(app)
          .post('/api/users')
          .send(largeData)
          .set('Content-Type', 'application/json');

        // Should handle it (reject or accept, but not crash)
        expect(response.status).toBeDefined();
        recordTest('Large payload handling', true);
      } catch (error) {
        // If it times out or crashes, that's a problem
        recordTest('Large payload handling', false, error);
      }
    });

    test('Server handles special characters in input', async () => {
      if (!app) {
        recordTest('Special character handling', false, new Error('App not loaded'));
        return;
      }

      try {
        const specialChars = {
          name: "<script>alert('xss')</script>",
          email: "test'; DROP TABLE users; --@example.com",
        };

        const response = await request(app)
          .post('/api/users')
          .send(specialChars)
          .set('Content-Type', 'application/json');

        // Should handle gracefully (not crash)
        expect(response.status).toBeDefined();
        recordTest('Special character handling', true);
      } catch (error) {
        recordTest('Special character handling', false, error);
        throw error;
      }
    });
  });
});

// module.exports = { testResults };
