/**
 * Courses E2E Tests
 * Tests for course management endpoints
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
  TestUser,
} from './test-utils';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Courses (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let agent: request.Agent;
  let professor: TestUser;
  let student: TestUser;

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
    // Clean up database before each test
    await cleanupDatabase(prisma);

    // Create test users
    professor = await createTestUser(agent, {
      email: `professor-${Date.now()}@test.com`,
      role: 'PROFESSOR',
    });

    student = await createTestUser(agent, {
      email: `student-${Date.now()}@test.com`,
      role: 'STUDENT',
    });
  });

  describe('POST /api/courses', () => {
    it('should create a course as a professor', async () => {
      const testData = generateTestData();
      const createCourseDto = {
        code: testData.courseCode,
        name: testData.courseName,
        description: 'A test course for E2E testing',
        semester: 'SPRING',
        year: 2026,
      };

      const response = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send(createCourseDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe(createCourseDto.code);
      expect(response.body.name).toBe(createCourseDto.name);
      expect(response.body.professorId).toBe(professor.id);
    });

    it('should fail to create course as a student', async () => {
      const testData = generateTestData();
      const createCourseDto = {
        code: testData.courseCode,
        name: testData.courseName,
        description: 'A test course',
        semester: 'SPRING',
        year: 2026,
      };

      await agent
        .post('/api/courses')
        .set(authHeader(student.accessToken))
        .send(createCourseDto)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      const testData = generateTestData();
      const createCourseDto = {
        code: testData.courseCode,
        name: testData.courseName,
        description: 'A test course',
        semester: 'SPRING',
        year: 2026,
      };

      await agent.post('/api/courses').send(createCourseDto).expect(401);
    });
  });

  describe('GET /api/courses', () => {
    let courseId: string;

    beforeEach(async () => {
      // Create a course for testing
      const testData = generateTestData();
      const response = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Test course',
          semester: 'FALL',
          year: 2026,
        });
      courseId = response.body.id;
    });

    it('should list all courses for authenticated users', async () => {
      const response = await agent
        .get('/api/courses')
        .set(authHeader(student.accessToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a specific course by id', async () => {
      const response = await agent
        .get(`/api/courses/${courseId}`)
        .set(authHeader(student.accessToken))
        .expect(200);

      expect(response.body.id).toBe(courseId);
    });

    it('should return 404 for non-existent course', async () => {
      await agent
        .get('/api/courses/non-existent-id')
        .set(authHeader(student.accessToken))
        .expect(404);
    });
  });

  describe('GET /api/courses/my-courses', () => {
    it('should return courses for the professor', async () => {
      // Create a course first
      const testData = generateTestData();
      await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Test course',
          semester: 'SPRING',
          year: 2026,
        })
        .expect(201);

      const response = await agent
        .get('/api/courses/my-courses')
        .set(authHeader(professor.accessToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].professorId).toBe(professor.id);
    });

    it('should fail for students', async () => {
      await agent
        .get('/api/courses/my-courses')
        .set(authHeader(student.accessToken))
        .expect(403);
    });
  });

  describe('PATCH /api/courses/:id', () => {
    let courseId: string;

    beforeEach(async () => {
      const testData = generateTestData();
      const response = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Original description',
          semester: 'FALL',
          year: 2026,
        });
      courseId = response.body.id;
    });

    it('should update a course as the owning professor', async () => {
      const updateDto = {
        description: 'Updated description',
      };

      const response = await agent
        .patch(`/api/courses/${courseId}`)
        .set(authHeader(professor.accessToken))
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toBe(updateDto.description);
    });

    it('should fail to update course as a student', async () => {
      await agent
        .patch(`/api/courses/${courseId}`)
        .set(authHeader(student.accessToken))
        .send({ description: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    let courseId: string;

    beforeEach(async () => {
      const testData = generateTestData();
      const response = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'To be deleted',
          semester: 'FALL',
          year: 2026,
        });
      courseId = response.body.id;
    });

    it('should delete a course as the owning professor', async () => {
      await agent
        .delete(`/api/courses/${courseId}`)
        .set(authHeader(professor.accessToken))
        .expect(200);

      // Verify course is deleted
      await agent
        .get(`/api/courses/${courseId}`)
        .set(authHeader(professor.accessToken))
        .expect(404);
    });

    it('should fail to delete course as a student', async () => {
      await agent
        .delete(`/api/courses/${courseId}`)
        .set(authHeader(student.accessToken))
        .expect(403);
    });
  });

  describe('POST /api/courses/:id/enrollments', () => {
    let courseId: string;
    let studentToEnroll: TestUser;

    beforeEach(async () => {
      const testData = generateTestData();
      const response = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Course for enrollment testing',
          semester: 'SPRING',
          year: 2026,
        });
      courseId = response.body.id;

      studentToEnroll = await createTestUser(agent, {
        email: `enroll-student-${Date.now()}@test.com`,
        role: 'STUDENT',
      });
    });

    it('should enroll students as professor', async () => {
      const enrollDto = {
        studentIds: [studentToEnroll.id],
      };

      const response = await agent
        .post(`/api/courses/${courseId}/enrollments`)
        .set(authHeader(professor.accessToken))
        .send(enrollDto)
        .expect(201);

      expect(response.body).toHaveProperty('enrolled');
    });

    it('should fail to enroll students as another student', async () => {
      const enrollDto = {
        studentIds: [studentToEnroll.id],
      };

      await agent
        .post(`/api/courses/${courseId}/enrollments`)
        .set(authHeader(student.accessToken))
        .send(enrollDto)
        .expect(403);
    });
  });
});
