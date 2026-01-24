/**
 * Auth E2E Tests
 * Tests for authentication endpoints: register, login, profile
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  cleanupDatabase,
  createTestUser,
  authHeader,
  generateTestData,
  TestApp,
} from './test-utils';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Auth (e2e)', () => {
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
    // Clean up users before each test
    await prisma.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const testData = generateTestData();
      const registerDto = {
        email: testData.email,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
      };

      const response = await agent
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.firstName).toBe(registerDto.firstName);
      expect(response.body.user.lastName).toBe(registerDto.lastName);
      expect(response.body.user.role).toBe(registerDto.role);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should register a professor successfully', async () => {
      const testData = generateTestData();
      const registerDto = {
        email: testData.email,
        password: 'ProfessorPass123!',
        firstName: 'Jane',
        lastName: 'Professor',
        role: 'PROFESSOR',
      };

      const response = await agent
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.user.role).toBe('PROFESSOR');
    });

    it('should fail to register with duplicate email', async () => {
      const testData = generateTestData();
      const registerDto = {
        email: testData.email,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
      };

      // First registration should succeed
      await agent.post('/api/auth/register').send(registerDto).expect(201);

      // Second registration with same email should fail
      const response = await agent
        .post('/api/auth/register')
        .send(registerDto)
        .expect(401);

      expect(response.body.message).toContain('already');
    });

    it('should fail with invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
      };

      const response = await agent
        .post('/api/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail with missing required fields', async () => {
      const registerDto = {
        email: 'test@example.com',
        // missing password, firstName, lastName
      };

      await agent.post('/api/auth/register').send(registerDto).expect(400);
    });

    it('should fail with weak password', async () => {
      const testData = generateTestData();
      const registerDto = {
        email: testData.email,
        password: '123', // too weak
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
      };

      await agent.post('/api/auth/register').send(registerDto).expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const testPassword = 'SecurePassword123!';
    let testEmail: string;

    beforeEach(async () => {
      // Create a test user before login tests
      const testData = generateTestData();
      testEmail = testData.email;

      await agent
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'STUDENT',
        })
        .expect(201);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should fail login with incorrect password', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should fail login with non-existent email', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should fail login with missing credentials', async () => {
      await agent.post('/api/auth/login').send({}).expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      const user = await createTestUser(agent);

      const response = await agent
        .get('/api/auth/me')
        .set(authHeader(user.accessToken))
        .expect(200);

      expect(response.body.email).toBe(user.email);
      expect(response.body.firstName).toBe(user.firstName);
      expect(response.body.lastName).toBe(user.lastName);
    });

    it('should fail without authentication token', async () => {
      await agent.get('/api/auth/me').expect(401);
    });

    it('should fail with invalid token', async () => {
      await agent
        .get('/api/auth/me')
        .set(authHeader('invalid-token'))
        .expect(401);
    });

    it('should fail with malformed authorization header', async () => {
      await agent
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);
    });
  });
});
