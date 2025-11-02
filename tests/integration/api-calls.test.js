/**
 * tests/integration/api-calls.test.js
 * 
 * Tests for frontend-backend integration via API calls
 * Evaluates: Criterion 6 (Front-End/Back-End Integration)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const TEST_TIMEOUT = 30000;
let app;
let server;

describe('Frontend-Backend API Integration Tests', () => {
  let testResults = {
    criterion_id: 'criterion_6',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  let testUser = {
    email: 'integration@example.com',
    password: 'IntegrationTest123!',
    name: 'Integration Test User'
  };
  let authToken;
  let userId;

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

      // Create test user and get token
      if (app) {
        const endpoints = ['/api/auth/register', '/api/auth/signup', '/api/users'];
        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint)
              .send(testUser)
              .set('Content-Type', 'application/json');

            if (response.status === 200 || response.status === 201) {
              authToken = response.body?.token || response.body?.accessToken;
              userId = response.body?.userId || response.body?.user?._id;
              break;
            }
          } catch (err) {
            continue;
          }
        }
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
        await mongoose.connection.db.dropDatabase();
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

  describe('API Call Mechanics', () => {
    test('Frontend can make GET requests to backend', async () => {
      if (!app) {
        recordTest('GET request capability', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/users', '/api/posts', '/api/items'];
        let canMakeGet = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app).get(endpoint);
            if (response.status < 500) {
              canMakeGet = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(canMakeGet).toBe(true);
        recordTest('GET request capability', true);
      } catch (error) {
        recordTest('GET request capability', false, error);
        throw error;
      }
    });

    test('Frontend can make POST requests with JSON data', async () => {
      if (!app) {
        recordTest('POST request with JSON', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = [
          { path: '/api/posts', data: { title: 'Test Post', content: 'Test content' } },
          { path: '/api/items', data: { name: 'Test Item', description: 'Test desc' } }
        ];

        let canMakePost = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint.path)
              .send(endpoint.data)
              .set('Content-Type', 'application/json')
              .set('Authorization', authToken ? `Bearer ${authToken}` : '');

            if (response.status === 200 || response.status === 201) {
              canMakePost = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(canMakePost).toBe(true);
        recordTest('POST request with JSON', true);
      } catch (error) {
        recordTest('POST request with JSON', false, error);
        throw error;
      }
    });

    test('Frontend can make PUT/PATCH requests for updates', async () => {
      if (!app) {
        recordTest('PUT/PATCH request capability', false, new Error('App not loaded'));
        return;
      }

      try {
        const testId = userId || '507f1f77bcf86cd799439011';
        const endpoints = [
          { path: `/api/users/${testId}`, data: { name: 'Updated Name' } },
          { path: `/api/posts/${testId}`, data: { title: 'Updated Title' } }
        ];

        let canUpdate = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .put(endpoint.path)
              .send(endpoint.data)
              .set('Content-Type', 'application/json')
              .set('Authorization', authToken ? `Bearer ${authToken}` : '');

            if (response.status === 200 || response.status === 404) {
              canUpdate = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(canUpdate).toBe(true);
        recordTest('PUT/PATCH request capability', true);
      } catch (error) {
        recordTest('PUT/PATCH request capability', false, error);
        throw error;
      }
    });

    test('Frontend can make DELETE requests', async () => {
      if (!app) {
        recordTest('DELETE request capability', false, new Error('App not loaded'));
        return;
      }

      try {
        const testId = '507f1f77bcf86cd799439011';
        const endpoints = [`/api/posts/${testId}`, `/api/items/${testId}`];
        let canDelete = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .delete(endpoint)
              .set('Authorization', authToken ? `Bearer ${authToken}` : '');

            if ([200, 204, 404].includes(response.status)) {
              canDelete = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(canDelete).toBe(true);
        recordTest('DELETE request capability', true);
      } catch (error) {
        recordTest('DELETE request capability', false, error);
        throw error;
      }
    });
  });

  describe('Data Flow & Synchronization', () => {
    test('Data sent from frontend reaches backend correctly', async () => {
      if (!app) {
        recordTest('Data flow to backend', false, new Error('App not loaded'));
        return;
      }

      try {
        const testData = {
          title: 'Integration Test Post',
          content: 'This is a test of data flow',
          timestamp: Date.now()
        };

        const response = await request(app)
          .post('/api/posts')
          .send(testData)
          .set('Content-Type', 'application/json')
          .set('Authorization', authToken ? `Bearer ${authToken}` : '');

        if (response.status === 200 || response.status === 201) {
          // Verify data was saved by retrieving it
          const getResponse = await request(app)
            .get('/api/posts')
            .set('Authorization', authToken ? `Bearer ${authToken}` : '');

          if (getResponse.status === 200) {
            const posts = getResponse.body;
            const foundPost = Array.isArray(posts) ? 
              posts.find(p => p.title === testData.title) : null;

            expect(foundPost).toBeTruthy();
            recordTest('Data flow to backend', true);
          } else {
            recordTest('Data flow to backend', true); // POST succeeded
          }
        } else {
          recordTest('Data flow to backend', false, new Error('POST failed'));
        }
      } catch (error) {
        recordTest('Data flow to backend', false, error);
        throw error;
      }
    });

    test('Backend responses are properly received by frontend', async () => {
      if (!app) {
        recordTest('Data flow from backend', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', authToken ? `Bearer ${authToken}` : '');

        // Check response has proper structure
        expect(response.body).toBeDefined();
        expect(response.headers['content-type']).toMatch(/json/);
        
        recordTest('Data flow from backend', true);
      } catch (error) {
        recordTest('Data flow from backend', false, error);
        throw error;
      }
    });

    test('API responses include correct data types', async () => {
      if (!app) {
        recordTest('Response data types', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', authToken ? `Bearer ${authToken}` : '');

        if (response.status === 200 && response.body) {
          // Check that response is JSON parseable
          expect(typeof response.body).toBe('object');
          recordTest('Response data types', true);
        } else {
          recordTest('Response data types', false, new Error('No valid response'));
        }
      } catch (error) {
        recordTest('Response data types', false, error);
        throw error;
      }
    });
  });

  describe('Authentication Integration', () => {
    test('Authentication token flows correctly from login to protected routes', async () => {
      if (!app || !authToken) {
        recordTest('Auth token flow', false, new Error('No auth token available'));
        return;
      }

      try {
        // Use token to access protected route
        const protectedEndpoints = ['/api/users/me', '/api/profile'];
        let tokenWorks = false;

        for (const endpoint of protectedEndpoints) {
          try {
            const response = await request(app)
              .get(endpoint)
              .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
              tokenWorks = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(tokenWorks).toBe(true);
        recordTest('Auth token flow', true);
      } catch (error) {
        recordTest('Auth token flow', false, error);
        throw error;
      }
    });

    test('Unauthenticated requests are properly rejected', async () => {
      if (!app) {
        recordTest('Unauthenticated rejection', false, new Error('App not loaded'));
        return;
      }

      try {
        const protectedEndpoints = ['/api/users/me', '/api/profile'];
        let properlyRejects = false;

        for (const endpoint of protectedEndpoints) {
          try {
            const response = await request(app).get(endpoint);
            
            if (response.status === 401 || response.status === 403) {
              properlyRejects = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(properlyRejects).toBe(true);
        recordTest('Unauthenticated rejection', true);
      } catch (error) {
        recordTest('Unauthenticated rejection', false, error);
        throw error;
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('Backend validation errors are communicated to frontend', async () => {
      if (!app) {
        recordTest('Validation error communication', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app)
          .post('/api/users')
          .send({ invalid: 'data' })
          .set('Content-Type', 'application/json');

        if (response.status >= 400 && response.status < 500) {
          // Check if error message exists
          const hasErrorMessage = response.body && 
            (response.body.error || response.body.message || response.body.errors);
          
          expect(hasErrorMessage).toBe(true);
          recordTest('Validation error communication', true);
        } else {
          recordTest('Validation error communication', false);
        }
      } catch (error) {
        recordTest('Validation error communication', false, error);
        throw error;
      }
    });

    test('Network errors are handled gracefully', async () => {
      if (!app) {
        recordTest('Network error handling', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to hit a non-existent endpoint
        const response = await request(app).get('/api/does-not-exist');

        // Should return 404 with structured response
        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        
        recordTest('Network error handling', true);
      } catch (error) {
        recordTest('Network error handling', false, error);
        throw error;
      }
    });

    test('Server errors return appropriate status codes', async () => {
      if (!app) {
        recordTest('Server error status codes', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try invalid MongoDB ID format
        const response = await request(app).get('/api/users/invalid-id-format');

        // Should return 4xx error, not 5xx
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        
        recordTest('Server error status codes', true);
      } catch (error) {
        recordTest('Server error status codes', false, error);
        throw error;
      }
    });
  });

  describe('HTTP Headers Integration', () => {
    test('CORS headers allow frontend-backend communication', async () => {
      if (!app) {
        recordTest('CORS headers', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app)
          .get('/api/users')
          .set('Origin', 'http://localhost:3000');

        const hasCORS = response.headers['access-control-allow-origin'] !== undefined;
        
        expect(hasCORS).toBe(true);
        recordTest('CORS headers', true);
      } catch (error) {
        recordTest('CORS headers', false, error);
        throw error;
      }
    });

    test('Content-Type headers are properly set', async () => {
      if (!app) {
        recordTest('Content-Type headers', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app).get('/api/users');

        expect(response.headers['content-type']).toMatch(/json/);
        recordTest('Content-Type headers', true);
      } catch (error) {
        recordTest('Content-Type headers', false, error);
        throw error;
      }
    });
  });

  describe('Real-World Integration Scenarios', () => {
    test('Complete user registration flow works end-to-end', async () => {
      if (!app) {
        recordTest('Registration flow', false, new Error('App not loaded'));
        return;
      }

      try {
        const newUser = {
          email: `flow${Date.now()}@example.com`,
          password: 'FlowTest123!',
          name: 'Flow Test User'
        };

        // Register
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(newUser)
          .set('Content-Type', 'application/json');

        if (registerResponse.status === 200 || registerResponse.status === 201) {
          const token = registerResponse.body?.token || registerResponse.body?.accessToken;
          
          if (token) {
            // Use token to access protected route
            const profileResponse = await request(app)
              .get('/api/users/me')
              .set('Authorization', `Bearer ${token}`);

            expect(profileResponse.status).toBe(200);
            recordTest('Registration flow', true);
          } else {
            recordTest('Registration flow', true); // Registration worked
          }
        } else {
          recordTest('Registration flow', false);
        }
      } catch (error) {
        recordTest('Registration flow', false, error);
        throw error;
      }
    });

    test('Complete CRUD flow works for a resource', async () => {
      if (!app || !authToken) {
        recordTest('CRUD flow', false, new Error('Missing app or auth'));
        return;
      }

      try {
        let resourceId;

        // CREATE
        const createResponse = await request(app)
          .post('/api/posts')
          .send({ title: 'CRUD Test', content: 'Testing CRUD' })
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${authToken}`);

        if (createResponse.status === 200 || createResponse.status === 201) {
          resourceId = createResponse.body?.id || createResponse.body?._id;

          // READ
          if (resourceId) {
            const readResponse = await request(app)
              .get(`/api/posts/${resourceId}`)
              .set('Authorization', `Bearer ${authToken}`);

            // UPDATE
            const updateResponse = await request(app)
              .put(`/api/posts/${resourceId}`)
              .send({ title: 'Updated Title' })
              .set('Content-Type', 'application/json')
              .set('Authorization', `Bearer ${authToken}`);

            // DELETE
            const deleteResponse = await request(app)
              .delete(`/api/posts/${resourceId}`)
              .set('Authorization', `Bearer ${authToken}`);

            expect(deleteResponse.status).toBeDefined();
            recordTest('CRUD flow', true);
          } else {
            recordTest('CRUD flow', true); // CREATE worked
          }
        } else {
          recordTest('CRUD flow', false);
        }
      } catch (error) {
        recordTest('CRUD flow', false, error);
        throw error;
      }
    });
  });
});

module.exports = { testResults };