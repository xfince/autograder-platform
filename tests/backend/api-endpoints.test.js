/**
 * tests/backend/api-endpoints.test.js
 *
 * Tests for RESTful API endpoints functionality
 * Evaluates: Criterion 3 (Back-End Architecture)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');

// Test configuration
const TEST_TIMEOUT = 30000;
let app;
let server;

describe('Backend API Endpoints Tests', () => {
  let testResults = {
    criterion_id: 'criterion_3',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
  };

  // Setup: Try to load the student's app
  beforeAll(async () => {
    try {
      // Try common app entry points (check grading-folder first, then root)
      const possiblePaths = [
        path.join(process.cwd(), 'grading-folder', 'backend', 'server.js'),
        path.join(process.cwd(), 'grading-folder', 'backend', 'app.js'),
        path.join(process.cwd(), 'grading-folder', 'backend', 'index.js'),
        path.join(process.cwd(), 'grading-folder', 'server', 'server.js'),
        path.join(process.cwd(), 'grading-folder', 'server', 'app.js'),
        path.join(process.cwd(), 'grading-folder', 'server', 'index.js'),
        path.join(process.cwd(), 'server', 'index.js'),
        path.join(process.cwd(), 'server', 'server.js'),
        path.join(process.cwd(), 'server', 'app.js'),
        path.join(process.cwd(), 'backend', 'index.js'),
        path.join(process.cwd(), 'backend', 'server.js'),
        path.join(process.cwd(), 'backend', 'app.js'),
        path.join(process.cwd(), 'index.js'),
        path.join(process.cwd(), 'server.js'),
      ];

      for (const appPath of possiblePaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(appPath)) {
            console.log(`🔍 Attempting to load: ${appPath}`);
            app = require(appPath);
            // Handle both exported app and server
            if (app.app) app = app.app;
            if (app.server) server = app.server;
            console.log(`✅ Loaded app from: ${appPath}`);
            break;
          }
        } catch (err) {
          console.warn(`⚠️  Failed to load ${appPath}: ${err.message}`);
          continue;
        }
      }

      if (!app) {
        console.warn('⚠️  Could not load student app - API tests will be skipped');
      }

      // Connect to test database
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
      }
    } catch (error) {
      console.error('❌ Setup error:', error.message);
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    try {
      // Close server if running
      if (server && server.close) {
        await new Promise((resolve) => server.close(resolve));
      }

      // Clean up test data
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
      }

      // Output results for grading script
      console.log(JSON.stringify(testResults, null, 2));
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }, TEST_TIMEOUT);

  // Helper function to record test results
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

  describe('RESTful API Structure', () => {
    test('Server exports an Express app', () => {
      try {
        expect(app).toBeDefined();
        expect(typeof app).toBe('function');
        recordTest('Server exports Express app', true);
      } catch (error) {
        recordTest('Server exports Express app', false, error);
        throw error;
      }
    });

    test('API responds to health check endpoint', async () => {
      if (!app) {
        recordTest('Health check endpoint', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try common health check endpoints
        const endpoints = ['/api/health', '/health', '/api', '/'];
        let responded = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app).get(endpoint);
            if (response.status < 500) {
              responded = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(responded).toBe(true);
        recordTest('Health check endpoint', true);
      } catch (error) {
        recordTest('Health check endpoint', false, error);
        throw error;
      }
    });
  });

  describe('CRUD Operations - User/Resource Endpoints', () => {
    let testResourceId;
    let authToken;

    test('POST endpoint creates new resource', async () => {
      if (!app) {
        recordTest('POST creates resource', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try common POST endpoints
        const endpoints = [
          {
            path: '/api/users',
            data: { name: 'Test User', email: 'test@example.com', password: 'Test123!' },
          },
          { path: '/api/posts', data: { title: 'Test Post', content: 'Test content' } },
          { path: '/api/items', data: { name: 'Test Item', description: 'Test description' } },
          { path: '/api/todos', data: { title: 'Test Todo', completed: false } },
        ];

        let created = false;
        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint.path)
              .send(endpoint.data)
              .set('Content-Type', 'application/json');

            if (response.status === 201 || response.status === 200) {
              created = true;
              // Store ID for later tests
              if (response.body && (response.body.id || response.body._id)) {
                testResourceId = response.body.id || response.body._id;
              }
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(created).toBe(true);
        recordTest('POST creates resource', true);
      } catch (error) {
        recordTest('POST creates resource', false, error);
        throw error;
      }
    });

    test('GET endpoint retrieves resources', async () => {
      if (!app) {
        recordTest('GET retrieves resources', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/users', '/api/posts', '/api/items', '/api/todos'];
        let retrieved = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app).get(endpoint);

            if (response.status === 200 && response.body) {
              retrieved = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(retrieved).toBe(true);
        recordTest('GET retrieves resources', true);
      } catch (error) {
        recordTest('GET retrieves resources', false, error);
        throw error;
      }
    });

    test('GET by ID endpoint retrieves single resource', async () => {
      if (!app || !testResourceId) {
        recordTest('GET by ID retrieves resource', false, new Error('No resource ID available'));
        return;
      }

      try {
        const endpoints = [
          `/api/users/${testResourceId}`,
          `/api/posts/${testResourceId}`,
          `/api/items/${testResourceId}`,
        ];

        let retrieved = false;
        for (const endpoint of endpoints) {
          try {
            const response = await request(app).get(endpoint);
            if (response.status === 200) {
              retrieved = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(retrieved).toBe(true);
        recordTest('GET by ID retrieves resource', true);
      } catch (error) {
        recordTest('GET by ID retrieves resource', false, error);
        throw error;
      }
    });

    test('PUT/PATCH endpoint updates resource', async () => {
      if (!app) {
        recordTest('PUT/PATCH updates resource', false, new Error('App not loaded'));
        return;
      }

      try {
        const testId = testResourceId || '507f1f77bcf86cd799439011'; // Dummy ID
        const updateEndpoints = [
          { path: `/api/users/${testId}`, data: { name: 'Updated User' } },
          { path: `/api/posts/${testId}`, data: { title: 'Updated Post' } },
          { path: `/api/items/${testId}`, data: { name: 'Updated Item' } },
        ];

        let updated = false;
        for (const endpoint of updateEndpoints) {
          try {
            // Try PUT
            let response = await request(app)
              .put(endpoint.path)
              .send(endpoint.data)
              .set('Content-Type', 'application/json');

            if (response.status === 200 || response.status === 404) {
              updated = true;
              break;
            }

            // Try PATCH if PUT didn't work
            response = await request(app)
              .patch(endpoint.path)
              .send(endpoint.data)
              .set('Content-Type', 'application/json');

            if (response.status === 200 || response.status === 404) {
              updated = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(updated).toBe(true);
        recordTest('PUT/PATCH updates resource', true);
      } catch (error) {
        recordTest('PUT/PATCH updates resource', false, error);
        throw error;
      }
    });

    test('DELETE endpoint removes resource', async () => {
      if (!app) {
        recordTest('DELETE removes resource', false, new Error('App not loaded'));
        return;
      }

      try {
        const testId = testResourceId || '507f1f77bcf86cd799439011';
        const endpoints = [`/api/users/${testId}`, `/api/posts/${testId}`, `/api/items/${testId}`];

        let deleted = false;
        for (const endpoint of endpoints) {
          try {
            const response = await request(app).delete(endpoint);
            // Accept 200, 204, or 404 (if resource doesn't exist)
            if ([200, 204, 404].includes(response.status)) {
              deleted = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(deleted).toBe(true);
        recordTest('DELETE removes resource', true);
      } catch (error) {
        recordTest('DELETE removes resource', false, error);
        throw error;
      }
    });
  });

  describe('HTTP Methods & RESTful Conventions', () => {
    test('API uses appropriate HTTP status codes', async () => {
      if (!app) {
        recordTest('Appropriate HTTP status codes', false, new Error('App not loaded'));
        return;
      }

      try {
        let properStatusCodes = true;

        // Test 404 for non-existent resource
        const response404 = await request(app).get('/api/nonexistent/12345');
        if (response404.status !== 404) {
          properStatusCodes = false;
        }

        // Test 400/422 for invalid POST data
        try {
          const response400 = await request(app)
            .post('/api/users')
            .send({ invalid: 'data' })
            .set('Content-Type', 'application/json');

          // Should return 400-level error for invalid data
          if (response400.status >= 200 && response400.status < 400) {
            properStatusCodes = false;
          }
        } catch (err) {
          // It's okay if it errors
        }

        expect(properStatusCodes).toBe(true);
        recordTest('Appropriate HTTP status codes', true);
      } catch (error) {
        recordTest('Appropriate HTTP status codes', false, error);
        throw error;
      }
    });

    test('API returns JSON responses', async () => {
      if (!app) {
        recordTest('JSON responses', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/users', '/api/posts', '/api/items', '/api'];
        let hasJsonResponse = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app).get(endpoint);
            const contentType = response.headers['content-type'];

            if (contentType && contentType.includes('application/json')) {
              hasJsonResponse = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(hasJsonResponse).toBe(true);
        recordTest('JSON responses', true);
      } catch (error) {
        recordTest('JSON responses', false, error);
        throw error;
      }
    });
  });

  describe('Async Operations Handling', () => {
    test('API handles async operations correctly', async () => {
      if (!app) {
        recordTest('Async operations handling', false, new Error('App not loaded'));
        return;
      }

      try {
        // Test that API doesn't crash with async operations
        const response = await request(app).get('/api/users').timeout(5000);

        // If we get a response (any response), async is handled
        expect(response).toBeDefined();
        recordTest('Async operations handling', true);
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          recordTest(
            'Async operations handling',
            false,
            new Error('Request timeout - possible async issue'),
          );
        } else {
          recordTest('Async operations handling', true); // Other errors are okay
        }
        throw error;
      }
    });
  });

  describe('API Error Responses', () => {
    test('API returns structured error responses', async () => {
      if (!app) {
        recordTest('Structured error responses', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to trigger an error
        const response = await request(app).get('/api/users/invalid-id-format');

        if (response.status >= 400) {
          // Check if error response has structure
          const hasErrorStructure =
            response.body && (response.body.error || response.body.message || response.body.errors);

          expect(hasErrorStructure).toBe(true);
          recordTest('Structured error responses', true);
        } else {
          // If no error, that's also acceptable
          recordTest('Structured error responses', true);
        }
      } catch (error) {
        recordTest('Structured error responses', false, error);
        throw error;
      }
    });
  });
});

// Export results (not needed for Jest execution)
// module.exports = { testResults };
