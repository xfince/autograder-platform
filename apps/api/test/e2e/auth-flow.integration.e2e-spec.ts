/**
 * Authentication Flow Integration Tests
 * Tests complete authentication workflows including token refresh and session management
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  cleanupDatabase,
  authHeader,
  generateTestData,
  TestApp,
} from './test-utils';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Authentication Flow Integration (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let agent: request.Agent;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    agent = testApp.request;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('Complete Registration and Login Flow', () => {
    it('should register, logout (client-side), and login again', async () => {
      const testData = generateTestData();
      const password = 'SecurePassword123!';

      // Step 1: Register
      const registerResponse = await agent
        .post('/api/auth/register')
        .send({
          email: testData.email,
          password: password,
          firstName: 'Test',
          lastName: 'User',
          role: 'STUDENT',
        })
        .expect(201);

      const firstToken = registerResponse.body.accessToken;
      expect(firstToken).toBeDefined();

      // Step 2: Verify we can access protected routes
      await agent
        .get('/api/auth/me')
        .set(authHeader(firstToken))
        .expect(200);

      // Step 3: Login again (simulating after logout)
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: testData.email,
          password: password,
        })
        .expect(201);

      const secondToken = loginResponse.body.accessToken;
      expect(secondToken).toBeDefined();

      // Both tokens should work (no token revocation implemented yet)
      await agent.get('/api/auth/me').set(authHeader(firstToken)).expect(200);
      await agent.get('/api/auth/me').set(authHeader(secondToken)).expect(200);
    });

    it('should maintain user identity across different requests', async () => {
      const testData = generateTestData();

      // Register user
      const registerResponse = await agent
        .post('/api/auth/register')
        .send({
          email: testData.email,
          password: 'SecurePassword123!',
          firstName: 'Consistent',
          lastName: 'User',
          role: 'STUDENT',
        })
        .expect(201);

      const token = registerResponse.body.accessToken;
      const userId = registerResponse.body.user.id;

      // Make multiple requests and verify user identity
      const responses = await Promise.all([
        agent.get('/api/auth/me').set(authHeader(token)),
        agent.get('/api/users/profile').set(authHeader(token)),
      ]);

      // All responses should return the same user
      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(userId);
        expect(res.body.email).toBe(testData.email);
      });
    });
  });

  describe('Role-Based Access Control Flow', () => {
    it('should enforce role restrictions across the application', async () => {
      const testData = generateTestData();

      // Create a student
      const studentResponse = await agent
        .post('/api/auth/register')
        .send({
          email: `student-${Date.now()}@test.com`,
          password: 'StudentPass123!',
          firstName: 'Student',
          lastName: 'User',
          role: 'STUDENT',
        })
        .expect(201);

      const studentToken = studentResponse.body.accessToken;

      // Create a professor
      const professorResponse = await agent
        .post('/api/auth/register')
        .send({
          email: `professor-${Date.now()}@test.com`,
          password: 'ProfessorPass123!',
          firstName: 'Professor',
          lastName: 'User',
          role: 'PROFESSOR',
        })
        .expect(201);

      const professorToken = professorResponse.body.accessToken;

      // Professor can create a course
      const courseResponse = await agent
        .post('/api/courses')
        .set(authHeader(professorToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Professor course',
          semester: 'SPRING',
          year: 2026,
        })
        .expect(201);

      // Student cannot create a course
      await agent
        .post('/api/courses')
        .set(authHeader(studentToken))
        .send({
          code: `ANOTHER-${Date.now()}`,
          name: 'Student Course',
          description: 'Should fail',
          semester: 'SPRING',
          year: 2026,
        })
        .expect(403);

      // Both can view courses
      await agent
        .get('/api/courses')
        .set(authHeader(studentToken))
        .expect(200);

      await agent
        .get('/api/courses')
        .set(authHeader(professorToken))
        .expect(200);

      // Professor can access my-courses
      await agent
        .get('/api/courses/my-courses')
        .set(authHeader(professorToken))
        .expect(200);

      // Student cannot access my-courses (professor only)
      await agent
        .get('/api/courses/my-courses')
        .set(authHeader(studentToken))
        .expect(403);
    });
  });

  describe('User Profile Management Flow', () => {
    it('should allow users to view and update their own profile', async () => {
      const testData = generateTestData();

      // Register user
      const registerResponse = await agent
        .post('/api/auth/register')
        .send({
          email: testData.email,
          password: 'SecurePassword123!',
          firstName: 'Original',
          lastName: 'Name',
          role: 'STUDENT',
        })
        .expect(201);

      const token = registerResponse.body.accessToken;

      // View profile
      const profileResponse = await agent
        .get('/api/users/profile')
        .set(authHeader(token))
        .expect(200);

      expect(profileResponse.body.firstName).toBe('Original');
      expect(profileResponse.body.lastName).toBe('Name');

      // Update profile
      const updateResponse = await agent
        .patch('/api/users/profile')
        .set(authHeader(token))
        .send({
          firstName: 'Updated',
          lastName: 'Profile',
        })
        .expect(200);

      expect(updateResponse.body.firstName).toBe('Updated');
      expect(updateResponse.body.lastName).toBe('Profile');

      // Verify update persisted
      const verifyResponse = await agent
        .get('/api/users/profile')
        .set(authHeader(token))
        .expect(200);

      expect(verifyResponse.body.firstName).toBe('Updated');
      expect(verifyResponse.body.lastName).toBe('Profile');
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle authentication errors gracefully', async () => {
      // Invalid token format
      const invalidTokenResponse = await agent
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(invalidTokenResponse.body.message).toBeDefined();

      // Missing token
      const missingTokenResponse = await agent
        .get('/api/auth/me')
        .expect(401);

      expect(missingTokenResponse.body.message).toBeDefined();

      // Wrong auth header format
      const wrongFormatResponse = await agent
        .get('/api/auth/me')
        .set('Authorization', 'Basic somebase64string')
        .expect(401);

      expect(wrongFormatResponse.body.message).toBeDefined();
    });

    it('should handle login errors with proper messages', async () => {
      const testData = generateTestData();

      // Register a user first
      await agent
        .post('/api/auth/register')
        .send({
          email: testData.email,
          password: 'CorrectPassword123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'STUDENT',
        })
        .expect(201);

      // Wrong password
      const wrongPasswordResponse = await agent
        .post('/api/auth/login')
        .send({
          email: testData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(wrongPasswordResponse.body.message).toBeDefined();
      // Should not reveal whether email exists
      expect(wrongPasswordResponse.body.message.toLowerCase()).not.toContain('email');

      // Non-existent email
      const nonExistentResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(nonExistentResponse.body.message).toBeDefined();
    });

    it('should validate input data and return appropriate errors', async () => {
      // Invalid email format
      const invalidEmailResponse = await agent
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'ValidPassword123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'STUDENT',
        })
        .expect(400);

      expect(invalidEmailResponse.body.message).toBeDefined();

      // Missing required fields
      const missingFieldsResponse = await agent
        .post('/api/auth/register')
        .send({
          email: 'valid@email.com',
          // missing other fields
        })
        .expect(400);

      expect(missingFieldsResponse.body.message).toBeDefined();

      // Invalid role
      const invalidRoleResponse = await agent
        .post('/api/auth/register')
        .send({
          email: 'valid@email.com',
          password: 'ValidPassword123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'INVALID_ROLE',
        })
        .expect(400);

      expect(invalidRoleResponse.body.message).toBeDefined();
    });
  });
});
