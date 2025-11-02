/**
 * tests/backend/auth.test.js
 * 
 * Tests for authentication and authorization functionality
 * Evaluates: Criterion 5 (Authentication & Authorization)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TEST_TIMEOUT = 30000;
let app;
let server;

describe('Authentication & Authorization Tests', () => {
  let testResults = {
    criterion_id: 'criterion_5',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  let testUser = {
    email: 'testauth@example.com',
    password: 'SecurePassword123!',
    name: 'Test Auth User'
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

  describe('User Registration', () => {
    test('POST /api/auth/register or /api/users creates new user', async () => {
      if (!app) {
        recordTest('User registration endpoint exists', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/auth/register', '/api/auth/signup', '/api/users', '/api/register'];
        let registered = false;
        let registrationResponse;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint)
              .send(testUser)
              .set('Content-Type', 'application/json');

            if (response.status === 200 || response.status === 201) {
              registered = true;
              registrationResponse = response;
              
              // Store user ID and token if provided
              if (response.body) {
                userId = response.body.userId || response.body.user?._id || response.body.user?.id;
                authToken = response.body.token || response.body.accessToken;
              }
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(registered).toBe(true);
        recordTest('User registration endpoint exists', true);
      } catch (error) {
        recordTest('User registration endpoint exists', false, error);
        throw error;
      }
    });

    test('Registration prevents duplicate emails', async () => {
      if (!app) {
        recordTest('Duplicate email prevention', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/auth/register', '/api/auth/signup', '/api/users'];
        let preventsDuplicate = false;

        for (const endpoint of endpoints) {
          try {
            // Try to register same user again
            const response = await request(app)
              .post(endpoint)
              .send(testUser)
              .set('Content-Type', 'application/json');

            // Should return 400-level error
            if (response.status >= 400 && response.status < 500) {
              preventsDuplicate = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(preventsDuplicate).toBe(true);
        recordTest('Duplicate email prevention', true);
      } catch (error) {
        recordTest('Duplicate email prevention', false, error);
        throw error;
      }
    });

    test('Passwords are hashed (not stored in plain text)', async () => {
      if (!app || !mongoose.connection.readyState) {
        recordTest('Password hashing', false, new Error('Cannot verify - no DB access'));
        return;
      }

      try {
        // Try to find User model and check password storage
        const collections = await mongoose.connection.db.listCollections().toArray();
        const userCollections = collections.filter(c => 
          c.name.toLowerCase().includes('user')
        );

        if (userCollections.length === 0) {
          recordTest('Password hashing', false, new Error('User collection not found'));
          return;
        }

        // Get a user from database
        const collection = mongoose.connection.db.collection(userCollections[0].name);
        const user = await collection.findOne({ email: testUser.email });

        if (!user) {
          recordTest('Password hashing', false, new Error('Test user not found in DB'));
          return;
        }

        // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        const isHashed = 
          user.password && 
          user.password !== testUser.password &&
          (user.password.startsWith('$2a$') || 
           user.password.startsWith('$2b$') || 
           user.password.startsWith('$2y$'));

        expect(isHashed).toBe(true);
        recordTest('Password hashing', true);
      } catch (error) {
        recordTest('Password hashing', false, error);
        throw error;
      }
    });
  });

  describe('User Login', () => {
    test('POST /api/auth/login authenticates valid user', async () => {
      if (!app) {
        recordTest('User login endpoint exists', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/auth/login', '/api/auth/signin', '/api/login'];
        let loggedIn = false;
        let loginResponse;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint)
              .send({
                email: testUser.email,
                password: testUser.password
              })
              .set('Content-Type', 'application/json');

            if (response.status === 200) {
              loggedIn = true;
              loginResponse = response;
              
              // Store token for later tests
              if (response.body && response.body.token) {
                authToken = response.body.token;
              } else if (response.body && response.body.accessToken) {
                authToken = response.body.accessToken;
              }
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(loggedIn).toBe(true);
        recordTest('User login endpoint exists', true);
      } catch (error) {
        recordTest('User login endpoint exists', false, error);
        throw error;
      }
    });

    test('Login returns JWT token', async () => {
      if (!app || !authToken) {
        recordTest('JWT token returned', false, new Error('No token received from login'));
        return;
      }

      try {
        // Verify token is a valid JWT format (has 3 parts separated by dots)
        const isJWT = authToken && authToken.split('.').length === 3;
        
        // Try to decode (without verification)
        let decoded = null;
        if (isJWT) {
          try {
            decoded = jwt.decode(authToken);
          } catch (err) {
            // Invalid JWT
          }
        }

        expect(isJWT && decoded).toBeTruthy();
        recordTest('JWT token returned', true);
      } catch (error) {
        recordTest('JWT token returned', false, error);
        throw error;
      }
    });

    test('Login rejects invalid credentials', async () => {
      if (!app) {
        recordTest('Invalid credentials rejected', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/auth/login', '/api/auth/signin', '/api/login'];
        let rejectsInvalid = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint)
              .send({
                email: testUser.email,
                password: 'WrongPassword123!'
              })
              .set('Content-Type', 'application/json');

            // Should return 401 or 400
            if (response.status === 401 || response.status === 400) {
              rejectsInvalid = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(rejectsInvalid).toBe(true);
        recordTest('Invalid credentials rejected', true);
      } catch (error) {
        recordTest('Invalid credentials rejected', false, error);
        throw error;
      }
    });
  });

  describe('Protected Routes', () => {
    test('Protected routes exist and require authentication', async () => {
      if (!app) {
        recordTest('Protected routes require auth', false, new Error('App not loaded'));
        return;
      }

      try {
        // Try accessing common protected endpoints without token
        const protectedEndpoints = [
          '/api/users/me',
          '/api/users/profile',
          '/api/profile',
          `/api/users/${userId || '507f1f77bcf86cd799439011'}`,
          '/api/posts',
          '/api/dashboard'
        ];

        let hasProtectedRoute = false;

        for (const endpoint of protectedEndpoints) {
          try {
            const response = await request(app).get(endpoint);
            
            // Should return 401 (Unauthorized) or 403 (Forbidden)
            if (response.status === 401 || response.status === 403) {
              hasProtectedRoute = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(hasProtectedRoute).toBe(true);
        recordTest('Protected routes require auth', true);
      } catch (error) {
        recordTest('Protected routes require auth', false, error);
        throw error;
      }
    });

    test('Protected routes accept valid JWT token', async () => {
      if (!app || !authToken) {
        recordTest('Protected routes accept valid token', false, new Error('No auth token available'));
        return;
      }

      try {
        const protectedEndpoints = [
          '/api/users/me',
          '/api/users/profile',
          '/api/profile'
        ];

        let acceptsToken = false;

        for (const endpoint of protectedEndpoints) {
          try {
            const response = await request(app)
              .get(endpoint)
              .set('Authorization', `Bearer ${authToken}`);

            // Should return 200 or 404 (if endpoint doesn't exist)
            if (response.status === 200 || response.status === 404) {
              acceptsToken = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(acceptsToken).toBe(true);
        recordTest('Protected routes accept valid token', true);
      } catch (error) {
        recordTest('Protected routes accept valid token', false, error);
        throw error;
      }
    });

    test('Protected routes reject invalid/expired tokens', async () => {
      if (!app) {
        recordTest('Protected routes reject invalid token', false, new Error('App not loaded'));
        return;
      }

      try {
        const protectedEndpoints = [
          '/api/users/me',
          '/api/users/profile',
          '/api/profile'
        ];

        let rejectsInvalidToken = false;
        const invalidToken = 'invalid.token.here';

        for (const endpoint of protectedEndpoints) {
          try {
            const response = await request(app)
              .get(endpoint)
              .set('Authorization', `Bearer ${invalidToken}`);

            // Should return 401 or 403
            if (response.status === 401 || response.status === 403) {
              rejectsInvalidToken = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        expect(rejectsInvalidToken).toBe(true);
        recordTest('Protected routes reject invalid token', true);
      } catch (error) {
        recordTest('Protected routes reject invalid token', false, error);
        throw error;
      }
    });
  });

  describe('Session Management', () => {
    test('User logout endpoint exists', async () => {
      if (!app) {
        recordTest('Logout endpoint exists', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/auth/logout', '/api/logout', '/api/auth/signout'];
        let hasLogout = false;

        for (const endpoint of endpoints) {
          try {
            const response = await request(app)
              .post(endpoint)
              .set('Authorization', `Bearer ${authToken || 'dummy'}`);

            // Any response (even 404) means endpoint might exist
            if (response.status !== 404) {
              hasLogout = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        // Logout is optional but good practice
        if (!hasLogout) {
          console.log('Note: Logout endpoint not found (optional feature)');
        }
        
        expect(true).toBe(true); // Don't fail if logout doesn't exist
        recordTest('Logout endpoint exists', hasLogout);
      } catch (error) {
        recordTest('Logout endpoint exists', false, error);
        throw error;
      }
    });
  });

  describe('Authorization & Role-Based Access', () => {
    test('Application has authorization logic (optional)', async () => {
      if (!app) {
        recordTest('Authorization logic present', false, new Error('App not loaded'));
        return;
      }

      try {
        // Check if there are different user roles
        // This is advanced and optional
        const collections = await mongoose.connection.db.listCollections().toArray();
        const userCollections = collections.filter(c => 
          c.name.toLowerCase().includes('user')
        );

        if (userCollections.length > 0) {
          const collection = mongoose.connection.db.collection(userCollections[0].name);
          const users = await collection.find({}).limit(5).toArray();
          
          // Check if any user has a 'role' field
          const hasRoles = users.some(user => user.role || user.roles);
          
          if (hasRoles) {
            recordTest('Authorization logic present', true);
          } else {
            // Not required, so pass
            recordTest('Authorization logic present', true);
          }
        } else {
          recordTest('Authorization logic present', true);
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest('Authorization logic present', true); // Don't fail on this
      }
    });
  });

  describe('Security Best Practices', () => {
    test('JWT secret is not hardcoded in code', async () => {
      try {
        // Check if JWT_SECRET is in environment variables
        const hasEnvSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.length > 0;
        
        expect(hasEnvSecret).toBe(true);
        recordTest('JWT secret from environment', true);
      } catch (error) {
        recordTest('JWT secret from environment', false, error);
        throw error;
      }
    });

    test('Password validation exists (minimum requirements)', async () => {
      if (!app) {
        recordTest('Password validation', false, new Error('App not loaded'));
        return;
      }

      try {
        const endpoints = ['/api/auth/register', '/api/auth/signup', '/api/users'];
        let hasValidation = false;

        for (const endpoint of endpoints) {
          try {
            // Try to register with weak password
            const response = await request(app)
              .post(endpoint)
              .send({
                email: 'weakpass@example.com',
                password: '123',
                name: 'Weak Pass User'
              })
              .set('Content-Type', 'application/json');

            // Should reject weak password (400-level error)
            if (response.status >= 400 && response.status < 500) {
              hasValidation = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        // Validation is good practice but not critical for this test
        recordTest('Password validation', hasValidation);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Password validation', false, error);
      }
    });
  });
});

module.exports = { testResults };