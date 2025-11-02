/**
 * tests/backend/middleware.test.js
 * 
 * Tests for middleware functionality
 * Evaluates: Criterion 3 (Back-End Architecture)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');

const TEST_TIMEOUT = 30000;
let app;
let server;

describe('Middleware Tests', () => {
  let testResults = {
    criterion_id: 'criterion_3',
    subsection: 'middleware',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: []
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
        path.join(process.cwd(), 'backend', 'server.js')
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
      error: error ? error.message : null
    });
  };

  describe('JSON Parsing Middleware', () => {
    test('Server accepts JSON in request body', async () => {
      if (!app) {
        recordTest('JSON parsing middleware', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/users', '/api/posts', '/api/items'];
        let acceptsJSON = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint)
              .send({ test: 'data' })
              .set('Content-Type', 'application/json');

            // If server responds (even with error), JSON middleware is working
            if (response.status < 500) {
              acceptsJSON = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(acceptsJSON).toBe(true);
        recordTest('JSON parsing middleware', true);
      } catch (error) {
        recordTest('JSON parsing middleware', false, error);
        throw error;
      }
    });
  });

  describe('CORS Middleware', () => {
    test('Server has CORS configured', async () => {
      if (!app) {
        recordTest('CORS middleware', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app)
          .options('/api/users')
          .set('Origin', 'http://localhost:3000')
          .set('Access-Control-Request-Method', 'GET');

        // Check for CORS headers
        const hasCORS = 
          response.headers['access-control-allow-origin'] ||
          response.headers['access-control-allow-methods'];

        expect(hasCORS).toBeTruthy();
        recordTest('CORS middleware', true);
      } catch (error) {
        recordTest('CORS middleware', false, error);
        throw error;
      }
    });
  });

  describe('Authentication Middleware', () => {
    test('Authentication middleware exists and validates tokens', async () => {
      if (!app) {
        recordTest('Authentication middleware', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to access protected endpoints without token
        const protectedEndpoints = [
          '/api/users/me',
          '/api/profile',
          '/api/dashboard'
        ];

        let hasAuthMiddleware = false;

        for (const endpoint of protectedEndpoints) {
          try {
            const responseWithoutToken = await request(app).get(endpoint);
            
            // Should return 401 or 403 (unauthorized)
            if (responseWithoutToken.status === 401 || responseWithoutToken.status === 403) {
              // Try with invalid token
              const responseWithInvalidToken = await request(app)
                .get(endpoint)
                .set('Authorization', 'Bearer invalid_token');

              if (responseWithInvalidToken.status === 401 || responseWithInvalidToken.status === 403) {
                hasAuthMiddleware = true;
                break;
              }
            }
          } catch (err) {
            continue;
          }
        }

        expect(hasAuthMiddleware).toBe(true);
        recordTest('Authentication middleware', true);
      } catch (error) {
        recordTest('Authentication middleware', false, error);
        throw error;
      }
    });
  });

  describe('Error Handling Middleware', () => {
    test('Server has global error handler', async () => {
      if (!app) {
        recordTest('Global error handler', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to trigger an error
        const response = await request(app).get('/api/trigger-error-route-that-does-not-exist');

        // Server should handle error gracefully (not crash)
        // Check if error response is structured
        expect(response).toBeDefined();
        expect(response.status).toBeDefined();
        
        recordTest('Global error handler', true);
      } catch (error) {
        recordTest('Global error handler', false, error);
        throw error;
      }
    });

    test('Error responses are consistent and structured', async () => {
      if (!app) {
        recordTest('Structured error responses', false, new Error('App not loaded'));
        return;
      }

      try {
        // Trigger multiple types of errors
        const response1 = await request(app).get('/api/users/invalid-id-format');
        const response2 = await request(app).get('/api/nonexistent-route');

        // Check if errors have consistent structure
        let hasStructure = false;

        if (response1.status >= 400 && response1.body) {
          hasStructure = Boolean(
            response1.body.error ||
            response1.body.message ||
            response1.body.msg ||
            response1.body.errors
          );
        }

        if (response2.status >= 400 && response2.body) {
          hasStructure = hasStructure && Boolean(
            response2.body.error ||
            response2.body.message ||
            response2.body.msg ||
            response2.body.errors
          );
        }

        expect(hasStructure).toBe(true);
        recordTest('Structured error responses', true);
      } catch (error) {
        recordTest('Structured error responses', false, error);
        throw error;
      }
    });
  });

  describe('Request Validation Middleware', () => {
    test('Server validates request data', async () => {
      if (!app) {
        recordTest('Request validation middleware', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to send invalid/incomplete data
        const endpoints = [
          { path: '/api/users', data: {} }, // Empty data
          { path: '/api/posts', data: { invalid: 'field' } }, // Invalid fields
        ];

        let hasValidation = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint.path)
              .send(endpoint.data)
              .set('Content-Type', 'application/json');

            // Should return 400-level error for invalid data
            if (response.status >= 400 && response.status < 500) {
              hasValidation = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        // Validation is good practice but not critical
        recordTest('Request validation middleware', hasValidation);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Request validation middleware', false, error);
      }
    });
  });

  describe('Logging Middleware', () => {
    test('Server likely uses logging middleware (Morgan, Winston, etc.)', () => {
      if (!app) {
        recordTest('Logging middleware', false, new Error('App not loaded'));
        return;
      }

      try {
        // Check if common logging packages are used
        const fs = require('fs');
        let packageJsonPath = path.join(process.cwd(), 'grading-folder', 'backend', 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
          packageJsonPath = path.join(process.cwd(), 'package.json');
        }
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };

          const hasLoggingPackage = 
            dependencies.morgan ||
            dependencies.winston ||
            dependencies['express-winston'] ||
            dependencies.pino;

          // Logging is good practice but not required
          recordTest('Logging middleware', Boolean(hasLoggingPackage));
        } else {
          recordTest('Logging middleware', false);
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest('Logging middleware', false, error);
      }
    });
  });

  describe('Rate Limiting Middleware', () => {
    test('Server has rate limiting for security (optional)', () => {
      if (!app) {
        recordTest('Rate limiting middleware', false, new Error('App not loaded'));
        return;
      }

      try {
        const fs = require('fs');
        let packageJsonPath = path.join(process.cwd(), 'grading-folder', 'backend', 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
          packageJsonPath = path.join(process.cwd(), 'package.json');
        }
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };

          const hasRateLimiting = 
            dependencies['express-rate-limit'] ||
            dependencies['rate-limiter-flexible'];

          // Rate limiting is advanced feature
          recordTest('Rate limiting middleware', Boolean(hasRateLimiting));
        } else {
          recordTest('Rate limiting middleware', false);
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest('Rate limiting middleware', false, error);
      }
    });
  });

  describe('Security Middleware (Helmet)', () => {
    test('Server uses security headers (Helmet)', async () => {
      if (!app) {
        recordTest('Security headers middleware', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app).get('/api');

        // Check for common security headers
        const hasSecurityHeaders = 
          response.headers['x-content-type-options'] ||
          response.headers['x-frame-options'] ||
          response.headers['strict-transport-security'] ||
          response.headers['x-xss-protection'];

        // Security headers are good practice
        recordTest('Security headers middleware', Boolean(hasSecurityHeaders));
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Security headers middleware', false, error);
      }
    });
  });

  describe('Custom Middleware', () => {
    test('Application uses custom middleware appropriately', () => {
      if (!app) {
        recordTest('Custom middleware usage', false, new Error('App not loaded'));
        return;
      }

      try {
        const fs = require('fs');
        const middlewarePaths = [
          path.join(process.cwd(), 'grading-folder', 'backend', 'middleware'),
          path.join(process.cwd(), 'grading-folder', 'server', 'middleware'),
          path.join(process.cwd(), 'server', 'middleware'),
          path.join(process.cwd(), 'backend', 'middleware'),
          path.join(process.cwd(), 'middleware')
        ];

        let hasCustomMiddleware = false;

        for (const middlewarePath of middlewarePaths) {
          if (fs.existsSync(middlewarePath)) {
            const files = fs.readdirSync(middlewarePath);
            if (files.length > 0) {
              hasCustomMiddleware = true;
              break;
            }
          }
        }

        // Custom middleware shows advanced understanding
        recordTest('Custom middleware usage', hasCustomMiddleware);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Custom middleware usage', false, error);
      }
    });
  });
});

module.exports = { testResults };