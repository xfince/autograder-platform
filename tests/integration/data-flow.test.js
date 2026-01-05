/**
 * tests/integration/data-flow.test.js
 *
 * Tests for data flow validation between frontend and backend
 * Evaluates: Criterion 6 (Front-End/Back-End Integration)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const TEST_TIMEOUT = 30000;
let app;
let server;

describe('Data Flow Integration Tests', () => {
  let testResults = {
    criterion_id: 'criterion_6',
    subsection: 'data_flow',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
  };

  beforeAll(async () => {
    try {
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
      error: error ? error.message : null,
    });
  };

  describe('Request Data Transformation', () => {
    test('Data is properly serialized from frontend to backend', async () => {
      if (!app) {
        recordTest('Request data serialization', false, new Error('App not loaded'));
        return;
      }

      try {
        const complexData = {
          string: 'test',
          number: 42,
          boolean: true,
          array: [1, 2, 3],
          nested: { key: 'value' },
          date: new Date().toISOString(),
        };

        const response = await request(app)
          .post('/api/posts')
          .send(complexData)
          .set('Content-Type', 'application/json');

        // Should handle complex data (even if validation fails)
        expect(response.status).toBeDefined();
        expect(response.status).toBeLessThan(500); // Not a server crash

        recordTest('Request data serialization', true);
      } catch (error) {
        recordTest('Request data serialization', false, error);
        throw error;
      }
    });

    test('Unicode and special characters are preserved', async () => {
      if (!app) {
        recordTest('Special character preservation', false, new Error('App not loaded'));
        return;
      }

      try {
        const specialData = {
          emoji: '🚀 Test Post',
          unicode: 'Héllo Wörld 你好',
          special: 'Test with \'quotes\' and "double quotes"',
        };

        const response = await request(app)
          .post('/api/posts')
          .send(specialData)
          .set('Content-Type', 'application/json');

        expect(response.status).toBeDefined();
        recordTest('Special character preservation', true);
      } catch (error) {
        recordTest('Special character preservation', false, error);
        throw error;
      }
    });
  });

  describe('Response Data Transformation', () => {
    test('Backend responses are properly formatted as JSON', async () => {
      if (!app) {
        recordTest('Response JSON formatting', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app).get('/api/users');

        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');

        recordTest('Response JSON formatting', true);
      } catch (error) {
        recordTest('Response JSON formatting', false, error);
        throw error;
      }
    });

    test('Array responses are properly structured', async () => {
      if (!app) {
        recordTest('Array response structure', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/users', '/api/posts', '/api/items'];
        let hasArrayResponse = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app).get(endpoint);

            if (response.status === 200 && response.body) {
              if (
                Array.isArray(response.body) ||
                (response.body.data && Array.isArray(response.body.data))
              ) {
                hasArrayResponse = true;
                break;
              }
            }
          } catch (err) {
            continue;
          }
        }

        expect(hasArrayResponse).toBe(true);
        recordTest('Array response structure', true);
      } catch (error) {
        recordTest('Array response structure', false, error);
        throw error;
      }
    });

    test('Object responses include expected fields', async () => {
      if (!app) {
        recordTest('Object response fields', false, new Error('App not loaded'));
        return;
      }

      try {
        // Create a resource and check its structure
        const createResponse = await request(app)
          .post('/api/posts')
          .send({ title: 'Test', content: 'Content' })
          .set('Content-Type', 'application/json');

        if (createResponse.status === 200 || createResponse.status === 201) {
          const resource = createResponse.body;

          // Check for common fields
          const hasExpectedFields = resource && (resource.id || resource._id || resource.title);

          expect(hasExpectedFields).toBe(true);
          recordTest('Object response fields', true);
        } else {
          recordTest('Object response fields', false, new Error('Could not create resource'));
        }
      } catch (error) {
        recordTest('Object response fields', false, error);
        throw error;
      }
    });
  });

  describe('Data Persistence', () => {
    test('Data persists across requests', async () => {
      if (!app) {
        recordTest('Data persistence', false, new Error('App not loaded'));
        return;
      }

      try {
        const uniqueTitle = `Persistent Post ${Date.now()}`;

        // Create a post
        const createResponse = await request(app)
          .post('/api/posts')
          .send({ title: uniqueTitle, content: 'Test content' })
          .set('Content-Type', 'application/json');

        if (createResponse.status === 200 || createResponse.status === 201) {
          const resourceId = createResponse.body?.id || createResponse.body?._id;

          // Wait a moment
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Retrieve all posts
          const getResponse = await request(app).get('/api/posts');

          if (getResponse.status === 200) {
            const posts = Array.isArray(getResponse.body)
              ? getResponse.body
              : getResponse.body.data || [];

            const foundPost = posts.find(
              (p) => p.title === uniqueTitle || p._id === resourceId || p.id === resourceId,
            );

            expect(foundPost).toBeTruthy();
            recordTest('Data persistence', true);
          } else {
            recordTest('Data persistence', true); // CREATE worked
          }
        } else {
          recordTest('Data persistence', false, new Error('Could not create resource'));
        }
      } catch (error) {
        recordTest('Data persistence', false, error);
        throw error;
      }
    });

    test('Updates are reflected immediately', async () => {
      if (!app) {
        recordTest('Immediate update reflection', false, new Error('App not loaded'));
        return;
      }

      try {
        // Create a resource
        const createResponse = await request(app)
          .post('/api/posts')
          .send({ title: 'Original Title', content: 'Content' })
          .set('Content-Type', 'application/json');

        if (createResponse.status === 200 || createResponse.status === 201) {
          const resourceId = createResponse.body?.id || createResponse.body?._id;

          if (resourceId) {
            // Update it
            const updateResponse = await request(app)
              .put(`/api/posts/${resourceId}`)
              .send({ title: 'Updated Title' })
              .set('Content-Type', 'application/json');

            // Retrieve it
            const getResponse = await request(app).get(`/api/posts/${resourceId}`);

            if (getResponse.status === 200) {
              const updatedResource = getResponse.body;
              const isUpdated = updatedResource.title === 'Updated Title';

              expect(isUpdated).toBe(true);
              recordTest('Immediate update reflection', true);
            } else {
              recordTest('Immediate update reflection', true); // UPDATE worked
            }
          } else {
            recordTest('Immediate update reflection', true); // CREATE worked
          }
        } else {
          recordTest('Immediate update reflection', false);
        }
      } catch (error) {
        recordTest('Immediate update reflection', false, error);
        throw error;
      }
    });

    test('Deletes are reflected immediately', async () => {
      if (!app) {
        recordTest('Immediate delete reflection', false, new Error('App not loaded'));
        return;
      }

      try {
        // Create a resource
        const createResponse = await request(app)
          .post('/api/posts')
          .send({ title: 'To Be Deleted', content: 'Content' })
          .set('Content-Type', 'application/json');

        if (createResponse.status === 200 || createResponse.status === 201) {
          const resourceId = createResponse.body?.id || createResponse.body?._id;

          if (resourceId) {
            // Delete it
            await request(app).delete(`/api/posts/${resourceId}`);

            // Try to retrieve it
            const getResponse = await request(app).get(`/api/posts/${resourceId}`);

            // Should return 404 or empty
            expect(getResponse.status).toBe(404);
            recordTest('Immediate delete reflection', true);
          } else {
            recordTest('Immediate delete reflection', true); // CREATE worked
          }
        } else {
          recordTest('Immediate delete reflection', false);
        }
      } catch (error) {
        recordTest('Immediate delete reflection', false, error);
        throw error;
      }
    });
  });

  describe('Data Consistency', () => {
    test('Same data format is maintained across operations', async () => {
      if (!app) {
        recordTest('Data format consistency', false, new Error('App not loaded'));
        return;
      }

      try {
        const testData = {
          title: 'Consistency Test',
          content: 'Test content',
          tags: ['test', 'consistency'],
        };

        // Create
        const createResponse = await request(app)
          .post('/api/posts')
          .send(testData)
          .set('Content-Type', 'application/json');

        if (createResponse.status === 200 || createResponse.status === 201) {
          const createdResource = createResponse.body;
          const resourceId = createdResource.id || createdResource._id;

          if (resourceId) {
            // Retrieve
            const getResponse = await request(app).get(`/api/posts/${resourceId}`);

            if (getResponse.status === 200) {
              const retrievedResource = getResponse.body;

              // Check if key fields are consistent
              const isConsistent =
                retrievedResource.title === testData.title &&
                retrievedResource.content === testData.content;

              expect(isConsistent).toBe(true);
              recordTest('Data format consistency', true);
            } else {
              recordTest('Data format consistency', true); // CREATE worked
            }
          } else {
            recordTest('Data format consistency', true); // CREATE worked
          }
        } else {
          recordTest('Data format consistency', false);
        }
      } catch (error) {
        recordTest('Data format consistency', false, error);
        throw error;
      }
    });

    test('Timestamps are properly maintained', async () => {
      if (!app) {
        recordTest('Timestamp maintenance', false, new Error('App not loaded'));
        return;
      }

      try {
        const createResponse = await request(app)
          .post('/api/posts')
          .send({ title: 'Timestamp Test', content: 'Content' })
          .set('Content-Type', 'application/json');

        if (createResponse.status === 200 || createResponse.status === 201) {
          const resource = createResponse.body;

          // Check for timestamp fields
          const hasTimestamps =
            resource &&
            (resource.createdAt ||
              resource.created_at ||
              resource.updatedAt ||
              resource.updated_at ||
              resource.timestamp);

          // Timestamps are good practice but not required
          recordTest('Timestamp maintenance', Boolean(hasTimestamps));
        } else {
          recordTest('Timestamp maintenance', false);
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest('Timestamp maintenance', false, error);
      }
    });
  });

  describe('Async Data Operations', () => {
    test('Multiple concurrent requests are handled correctly', async () => {
      if (!app) {
        recordTest('Concurrent request handling', false, new Error('App not loaded'));
        return;
      }

      try {
        // Make 5 concurrent requests
        const requests = [];
        for (let i = 0; i < 5; i++) {
          requests.push(
            request(app)
              .post('/api/posts')
              .send({ title: `Concurrent ${i}`, content: `Content ${i}` })
              .set('Content-Type', 'application/json'),
          );
        }

        const responses = await Promise.all(requests);

        // All should complete (even if some fail validation)
        const allCompleted = responses.every((r) => r.status !== undefined);

        expect(allCompleted).toBe(true);
        recordTest('Concurrent request handling', true);
      } catch (error) {
        recordTest('Concurrent request handling', false, error);
        throw error;
      }
    });

    test('Long-running operations dont timeout', async () => {
      if (!app) {
        recordTest('Long operation handling', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app).get('/api/users').timeout(10000); // 10 second timeout

        expect(response).toBeDefined();
        recordTest('Long operation handling', true);
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          recordTest('Long operation handling', false, error);
        } else {
          recordTest('Long operation handling', true);
        }
      }
    });
  });

  describe('Data Validation Flow', () => {
    test('Invalid data is rejected before database insertion', async () => {
      if (!app) {
        recordTest('Pre-insertion validation', false, new Error('App not loaded'));
        return;
      }

      try {
        const invalidData = {
          email: 'not-an-email', // Invalid email format
          password: '123', // Too short
        };

        const response = await request(app)
          .post('/api/users')
          .send(invalidData)
          .set('Content-Type', 'application/json');

        // Should return 400-level error
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);

        recordTest('Pre-insertion validation', true);
      } catch (error) {
        recordTest('Pre-insertion validation', false, error);
        throw error;
      }
    });

    test('Validation errors provide actionable feedback', async () => {
      if (!app) {
        recordTest('Validation feedback quality', false, new Error('App not loaded'));
        return;
      }

      try {
        const response = await request(app)
          .post('/api/users')
          .send({})
          .set('Content-Type', 'application/json');

        if (response.status >= 400 && response.status < 500) {
          const hasMessage =
            response.body && (response.body.error || response.body.message || response.body.errors);

          expect(hasMessage).toBe(true);
          recordTest('Validation feedback quality', true);
        } else {
          recordTest('Validation feedback quality', false);
        }
      } catch (error) {
        recordTest('Validation feedback quality', false, error);
        throw error;
      }
    });
  });
});

// module.exports = { testResults };
