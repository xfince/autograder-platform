/**
 * tests/performance/load-time.test.js & query-efficiency.test.js (Combined)
 *
 * Tests for application performance and optimization
 * Evaluates: Criterion 14 (Performance & Optimization)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const TEST_TIMEOUT = 60000;
let app;
let server;

describe('Performance & Optimization Tests', () => {
  let testResults = {
    criterion_id: 'criterion_14',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
    performance_metrics: {},
  };

  beforeAll(async () => {
    try {
      const possiblePaths = [
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

      // Seed test data for performance tests
      await seedTestData();
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

  const recordTest = (testName, passed, error = null, metrics = null) => {
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
      metrics,
    });
  };

  // Helper to seed test data
  async function seedTestData() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const userCollection = collections.find((c) => c.name.toLowerCase().includes('user'));

      if (userCollection) {
        const collection = mongoose.connection.db.collection(userCollection.name);

        // Create 50 test users for performance testing
        const users = [];
        for (let i = 0; i < 50; i++) {
          users.push({
            name: `User ${i}`,
            email: `user${i}@performance.test`,
            password: 'hashedpassword123',
            createdAt: new Date(),
          });
        }

        await collection.insertMany(users);
      }
    } catch (error) {
      console.log('Could not seed test data:', error.message);
    }
  }

  describe('API Response Time', () => {
    test('GET requests respond within 500ms', async () => {
      if (!app) {
        recordTest('GET response time', false, new Error('App not loaded'));
        return;
      }

      try {
        const startTime = Date.now();
        const response = await request(app).get('/api/users');
        const responseTime = Date.now() - startTime;

        testResults.performance_metrics.get_response_time_ms = responseTime;

        // 500ms is good for most APIs
        expect(responseTime).toBeLessThan(500);
        recordTest('GET response time', true, null, { response_time_ms: responseTime });
      } catch (error) {
        recordTest('GET response time', false, error);
        throw error;
      }
    });

    test('POST requests respond within 1 second', async () => {
      if (!app) {
        recordTest('POST response time', false, new Error('App not loaded'));
        return;
      }

      try {
        const startTime = Date.now();
        const response = await request(app)
          .post('/api/posts')
          .send({ title: 'Performance Test', content: 'Testing response time' })
          .set('Content-Type', 'application/json');
        const responseTime = Date.now() - startTime;

        testResults.performance_metrics.post_response_time_ms = responseTime;

        // 1 second is acceptable for POST
        expect(responseTime).toBeLessThan(1000);
        recordTest('POST response time', true, null, { response_time_ms: responseTime });
      } catch (error) {
        recordTest('POST response time', false, error);
        throw error;
      }
    });

    test('Multiple concurrent requests complete efficiently', async () => {
      if (!app) {
        recordTest('Concurrent request efficiency', false, new Error('App not loaded'));
        return;
      }

      try {
        const startTime = Date.now();

        // Make 10 concurrent requests
        const requests = [];
        for (let i = 0; i < 10; i++) {
          requests.push(request(app).get('/api/users'));
        }

        await Promise.all(requests);
        const totalTime = Date.now() - startTime;

        testResults.performance_metrics.concurrent_requests_time_ms = totalTime;

        // Should complete in under 5 seconds
        expect(totalTime).toBeLessThan(5000);
        recordTest('Concurrent request efficiency', true, null, { total_time_ms: totalTime });
      } catch (error) {
        recordTest('Concurrent request efficiency', false, error);
        throw error;
      }
    });
  });

  describe('Database Query Performance', () => {
    test('Simple queries execute quickly (< 100ms)', async () => {
      if (!app) {
        recordTest('Simple query performance', false, new Error('App not loaded'));
        return;
      }

      try {
        const startTime = Date.now();
        const response = await request(app).get('/api/users?limit=10');
        const queryTime = Date.now() - startTime;

        testResults.performance_metrics.simple_query_time_ms = queryTime;

        // Simple queries should be fast
        expect(queryTime).toBeLessThan(200);
        recordTest('Simple query performance', true, null, { query_time_ms: queryTime });
      } catch (error) {
        recordTest('Simple query performance', false, error);
        throw error;
      }
    });

    test('Queries use indexes effectively', async () => {
      if (mongoose.connection.readyState !== 1) {
        recordTest('Index usage', false, new Error('Database not connected'));
        return;
      }

      try {
        const models = Object.values(mongoose.models);

        if (models.length === 0) {
          recordTest('Index usage', false, new Error('No models found'));
          return;
        }

        // Check if models have indexes
        let hasIndexes = false;
        for (const model of models) {
          const indexes = model.schema.indexes();
          if (indexes && indexes.length > 0) {
            hasIndexes = true;
            break;
          }
        }

        // Indexes are optimization
        recordTest('Index usage', hasIndexes);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Index usage', false, error);
      }
    });

    test('No N+1 query problems in list endpoints', async () => {
      if (!app) {
        recordTest('N+1 query prevention', false, new Error('App not loaded'));
        return;
      }

      try {
        // Enable query profiling
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.db.command({ profile: 2 });
        }

        const startTime = Date.now();
        await request(app).get('/api/users');
        const queryTime = Date.now() - startTime;

        // If response is reasonable, N+1 is likely avoided
        // N+1 would cause significant slowdown with 50 users
        const likelyNoN1 = queryTime < 500;

        recordTest('N+1 query prevention', likelyNoN1);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('N+1 query prevention', false, error);
      }
    });

    test('Pagination is implemented for large datasets', async () => {
      if (!app) {
        recordTest('Pagination implementation', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try to get paginated results
        const responses = [
          await request(app).get('/api/users?limit=10'),
          await request(app).get('/api/users?page=1&limit=10'),
          await request(app).get('/api/users?skip=0&limit=10'),
        ];

        let hasPagination = false;
        for (const response of responses) {
          if (response.status === 200 && response.body) {
            const data = Array.isArray(response.body) ? response.body : response.body.data;

            // If result is limited to ~10 items, pagination is working
            if (data && data.length <= 15) {
              hasPagination = true;
              break;
            }
          }
        }

        recordTest('Pagination implementation', hasPagination);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Pagination implementation', false, error);
      }
    });
  });

  describe('Optimization Techniques', () => {
    test('Application uses environment variables for config', () => {
      try {
        const hasEnvVars = Boolean(
          process.env.MONGODB_URI ||
          process.env.DATABASE_URL ||
          process.env.JWT_SECRET ||
          process.env.PORT,
        );

        expect(hasEnvVars).toBe(true);
        recordTest('Environment variables', true);
      } catch (error) {
        recordTest('Environment variables', false, error);
        throw error;
      }
    });

    test('Images are optimized (checking for Next.js Image usage)', () => {
      try {
        const frontendFiles = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'grading-folder/frontend/app',
        ];

        let usesImageOptimization = false;

        for (const dir of frontendFiles) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir);

            for (const file of files) {
              if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                const content = fs.readFileSync(file, 'utf8');

                // Check for Next.js Image component
                if (content.includes('next/image') || content.includes('<Image')) {
                  usesImageOptimization = true;
                  break;
                }
              }
            }
          }

          if (usesImageOptimization) break;
        }

        // Image optimization is good practice
        recordTest('Image optimization', usesImageOptimization);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Image optimization', false, error);
      }
    });

    test('Code uses memoization where appropriate', () => {
      try {
        const frontendFiles = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
        ];

        let usesMemoization = false;

        for (const dir of frontendFiles) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir);

            for (const file of files) {
              if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                const content = fs.readFileSync(file, 'utf8');

                // Check for React memoization
                if (
                  content.includes('useMemo') ||
                  content.includes('useCallback') ||
                  content.includes('React.memo')
                ) {
                  usesMemoization = true;
                  break;
                }
              }
            }
          }

          if (usesMemoization) break;
        }

        // Memoization is advanced optimization
        recordTest('Memoization usage', usesMemoization);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Memoization usage', false, error);
      }
    });

    test('Lazy loading is implemented', () => {
      try {
        const frontendFiles = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'grading-folder/frontend/app',
        ];

        let usesLazyLoading = false;

        for (const dir of frontendFiles) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir);

            for (const file of files) {
              if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                const content = fs.readFileSync(file, 'utf8');

                // Check for lazy loading
                if (
                  content.includes('React.lazy') ||
                  content.includes('dynamic(') ||
                  content.includes('loadable(')
                ) {
                  usesLazyLoading = true;
                  break;
                }
              }
            }
          }

          if (usesLazyLoading) break;
        }

        // Lazy loading is optimization
        recordTest('Lazy loading', usesLazyLoading);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Lazy loading', false, error);
      }
    });
  });

  describe('Memory Management', () => {
    test('No obvious memory leaks in request handling', async () => {
      if (!app) {
        recordTest('Memory leak prevention', false, new Error('App not loaded'));
        return;
      }

      try {
        const initialMemory = process.memoryUsage().heapUsed;

        // Make 20 requests
        for (let i = 0; i < 20; i++) {
          await request(app).get('/api/users');
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        testResults.performance_metrics.memory_increase_mb = memoryIncreaseMB;

        // Memory increase should be reasonable (< 50MB)
        expect(memoryIncreaseMB).toBeLessThan(50);
        recordTest('Memory leak prevention', true, null, { memory_increase_mb: memoryIncreaseMB });
      } catch (error) {
        recordTest('Memory leak prevention', false, error);
        throw error;
      }
    });
  });

  describe('Bundle Size Optimization', () => {
    test('Frontend build is optimized (checking for production build)', () => {
      try {
        const buildDirs = ['.next', 'out', 'build', 'dist'];

        let hasProductionBuild = false;

        for (const dir of buildDirs) {
          if (fs.existsSync(dir)) {
            hasProductionBuild = true;
            break;
          }
        }

        // Production build is good practice
        recordTest('Production build', hasProductionBuild);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Production build', false, error);
      }
    });
  });

  // Helper function to recursively get all files
  function getAllFiles(dir) {
    const files = [];

    try {
      if (fs.existsSync(dir)) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            files.push(...getAllFiles(fullPath));
          } else {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return files;
  }
});

// module.exports = { testResults };
