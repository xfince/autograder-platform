/**
 * E2E Test Utilities
 * Helper functions for setting up and tearing down E2E tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  request: request.Agent;
}

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accessToken: string;
}

/**
 * Creates a test application instance with all modules loaded
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(ConfigModule)
    .useModule(
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
        load: [
          () => ({
            JWT_SECRET: 'e2e-test-jwt-secret-key-256-bits-minimum',
            JWT_EXPIRES_IN: '1h',
            JWT_REFRESH_SECRET: 'e2e-test-refresh-secret-key',
            JWT_REFRESH_EXPIRES_IN: '7d',
          }),
        ],
      }),
    )
    .compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply the same pipes as in main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  await app.init();

  const prisma = moduleFixture.get<PrismaService>(PrismaService);
  const agent = request.agent(app.getHttpServer());

  return { app, prisma, request: agent };
}

/**
 * Cleans up the test database by deleting all test data
 */
export async function cleanupDatabase(prisma: PrismaService): Promise<void> {
  // Delete in order respecting foreign key constraints
  const tablesToClean = [
    'GradingResult',
    'Submission',
    'TestSuite',
    'Rubric',
    'Assignment',
    'Enrollment',
    'Course',
    'User',
  ];

  for (const table of tablesToClean) {
    try {
      await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
    } catch {
      // Table might not exist or be empty
    }
  }
}

/**
 * Creates a test user and returns the user with access token
 */
export async function createTestUser(
  agent: request.Agent,
  userData?: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  }>,
): Promise<TestUser> {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT' as const,
  };

  const registerData = { ...defaultData, ...userData };

  const response = await agent
    .post('/api/auth/register')
    .send(registerData)
    .expect(201);

  return {
    id: response.body.user.id,
    email: response.body.user.email,
    firstName: response.body.user.firstName,
    lastName: response.body.user.lastName,
    role: response.body.user.role,
    accessToken: response.body.accessToken,
  };
}

/**
 * Creates authenticated request headers
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Generates unique test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    email: `test-${timestamp}-${random}@example.com`,
    courseCode: `TEST-${timestamp}`,
    courseName: `Test Course ${timestamp}`,
    assignmentTitle: `Test Assignment ${timestamp}`,
  };
}
