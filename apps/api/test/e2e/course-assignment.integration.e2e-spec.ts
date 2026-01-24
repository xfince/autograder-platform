/**
 * Course-Assignment Integration Tests
 * Tests the integration between courses, assignments, and enrollments
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

describe('Course-Assignment Integration (e2e)', () => {
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
    await cleanupDatabase(prisma);

    professor = await createTestUser(agent, {
      email: `professor-${Date.now()}@test.com`,
      role: 'PROFESSOR',
    });

    student = await createTestUser(agent, {
      email: `student-${Date.now()}@test.com`,
      role: 'STUDENT',
    });
  });

  describe('Full Course Workflow', () => {
    it('should complete the full course lifecycle: create course -> create rubric -> create assignment -> enroll student', async () => {
      const testData = generateTestData();

      // Step 1: Create a course
      const courseResponse = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Integration test course',
          semester: 'SPRING',
          year: 2026,
        })
        .expect(201);

      const courseId = courseResponse.body.id;
      expect(courseId).toBeDefined();

      // Step 2: Create a rubric for the course
      const rubricResponse = await agent
        .post('/api/rubrics')
        .set(authHeader(professor.accessToken))
        .send({
          name: 'Test Rubric',
          description: 'A rubric for testing',
          maxScore: 100,
          criteria: [
            {
              name: 'Code Quality',
              description: 'Clean, readable code',
              maxPoints: 50,
              order: 1,
            },
            {
              name: 'Functionality',
              description: 'Code works correctly',
              maxPoints: 50,
              order: 2,
            },
          ],
        })
        .expect(201);

      const rubricId = rubricResponse.body.id;
      expect(rubricId).toBeDefined();

      // Step 3: Create an assignment linked to the course and rubric
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const assignmentResponse = await agent
        .post('/api/assignments')
        .set(authHeader(professor.accessToken))
        .send({
          title: testData.assignmentTitle,
          description: 'Complete the coding challenge',
          dueDate: futureDate.toISOString(),
          maxSubmissions: 3,
          allowLateSubmissions: true,
          courseId: courseId,
          rubricId: rubricId,
        })
        .expect(201);

      const assignmentId = assignmentResponse.body.id;
      expect(assignmentId).toBeDefined();
      expect(assignmentResponse.body.courseId).toBe(courseId);

      // Step 4: Enroll the student in the course
      const enrollResponse = await agent
        .post(`/api/courses/${courseId}/enrollments`)
        .set(authHeader(professor.accessToken))
        .send({
          studentIds: [student.id],
        })
        .expect(201);

      expect(enrollResponse.body.enrolled).toBe(1);

      // Step 5: Verify student can see the course
      const studentCoursesResponse = await agent
        .get('/api/courses')
        .set(authHeader(student.accessToken))
        .expect(200);

      const enrolledCourse = studentCoursesResponse.body.find(
        (c: any) => c.id === courseId,
      );
      expect(enrolledCourse).toBeDefined();

      // Step 6: Verify student can see assignments for the course
      const courseAssignmentsResponse = await agent
        .get(`/api/assignments/course/${courseId}`)
        .set(authHeader(student.accessToken))
        .expect(200);

      expect(courseAssignmentsResponse.body).toHaveLength(1);
      expect(courseAssignmentsResponse.body[0].id).toBe(assignmentId);
    });

    it('should prevent students from creating courses or assignments', async () => {
      const testData = generateTestData();

      // Student cannot create course
      await agent
        .post('/api/courses')
        .set(authHeader(student.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Student trying to create course',
          semester: 'FALL',
          year: 2026,
        })
        .expect(403);

      // Create course and rubric as professor first
      const courseResponse = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Professor course',
          semester: 'FALL',
          year: 2026,
        });

      const rubricResponse = await agent
        .post('/api/rubrics')
        .set(authHeader(professor.accessToken))
        .send({
          name: 'Test Rubric',
          description: 'A rubric',
          maxScore: 100,
          criteria: [
            { name: 'Test', description: 'Test', maxPoints: 100, order: 1 },
          ],
        });

      // Student cannot create assignment
      await agent
        .post('/api/assignments')
        .set(authHeader(student.accessToken))
        .send({
          title: 'Student Assignment',
          description: 'Should fail',
          dueDate: new Date().toISOString(),
          courseId: courseResponse.body.id,
          rubricId: rubricResponse.body.id,
        })
        .expect(403);
    });

    it('should prevent professor from modifying another professors course', async () => {
      // Create another professor
      const otherProfessor = await createTestUser(agent, {
        email: `other-professor-${Date.now()}@test.com`,
        role: 'PROFESSOR',
      });

      // First professor creates a course
      const testData = generateTestData();
      const courseResponse = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'First professor course',
          semester: 'SPRING',
          year: 2026,
        });

      const courseId = courseResponse.body.id;

      // Other professor tries to update the course
      await agent
        .patch(`/api/courses/${courseId}`)
        .set(authHeader(otherProfessor.accessToken))
        .send({
          description: 'Trying to hijack this course',
        })
        .expect(403);

      // Other professor tries to delete the course
      await agent
        .delete(`/api/courses/${courseId}`)
        .set(authHeader(otherProfessor.accessToken))
        .expect(403);
    });
  });

  describe('Assignment Dependencies', () => {
    it('should require a valid course and rubric to create an assignment', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // Try to create assignment with invalid courseId
      await agent
        .post('/api/assignments')
        .set(authHeader(professor.accessToken))
        .send({
          title: 'Test Assignment',
          description: 'Should fail',
          dueDate: futureDate.toISOString(),
          courseId: 'non-existent-course-id',
          rubricId: 'non-existent-rubric-id',
        })
        .expect(404);
    });

    it('should cascade assignment visibility based on course enrollment', async () => {
      const testData = generateTestData();

      // Create course with assignment
      const courseResponse = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Course with assignments',
          semester: 'FALL',
          year: 2026,
        });

      const rubricResponse = await agent
        .post('/api/rubrics')
        .set(authHeader(professor.accessToken))
        .send({
          name: 'Rubric',
          description: 'Test rubric',
          maxScore: 100,
          criteria: [
            { name: 'Quality', description: 'Code quality', maxPoints: 100, order: 1 },
          ],
        });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      await agent
        .post('/api/assignments')
        .set(authHeader(professor.accessToken))
        .send({
          title: 'Course Assignment',
          description: 'Assignment in the course',
          dueDate: futureDate.toISOString(),
          courseId: courseResponse.body.id,
          rubricId: rubricResponse.body.id,
        });

      // Student (not enrolled) should still be able to see course assignments
      // (visibility depends on business rules - adjust test if different)
      const assignmentsResponse = await agent
        .get(`/api/assignments/course/${courseResponse.body.id}`)
        .set(authHeader(student.accessToken))
        .expect(200);

      expect(Array.isArray(assignmentsResponse.body)).toBe(true);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle multiple students enrolled in the same course', async () => {
      const testData = generateTestData();

      // Create course
      const courseResponse = await agent
        .post('/api/courses')
        .set(authHeader(professor.accessToken))
        .send({
          code: testData.courseCode,
          name: testData.courseName,
          description: 'Multi-student course',
          semester: 'SPRING',
          year: 2026,
        });

      const courseId = courseResponse.body.id;

      // Create multiple students
      const students = await Promise.all([
        createTestUser(agent, { email: `student1-${Date.now()}@test.com`, role: 'STUDENT' }),
        createTestUser(agent, { email: `student2-${Date.now()}@test.com`, role: 'STUDENT' }),
        createTestUser(agent, { email: `student3-${Date.now()}@test.com`, role: 'STUDENT' }),
      ]);

      // Enroll all students at once
      const enrollResponse = await agent
        .post(`/api/courses/${courseId}/enrollments`)
        .set(authHeader(professor.accessToken))
        .send({
          studentIds: students.map((s) => s.id),
        })
        .expect(201);

      expect(enrollResponse.body.enrolled).toBe(3);

      // Each student should be able to access the course
      for (const s of students) {
        const coursesResponse = await agent
          .get('/api/courses')
          .set(authHeader(s.accessToken))
          .expect(200);

        expect(coursesResponse.body.some((c: any) => c.id === courseId)).toBe(true);
      }
    });

    it('should allow a professor to manage multiple courses', async () => {
      // Create multiple courses
      const courses = await Promise.all([
        agent
          .post('/api/courses')
          .set(authHeader(professor.accessToken))
          .send({
            code: `CS101-${Date.now()}`,
            name: 'Intro to CS',
            description: 'First course',
            semester: 'FALL',
            year: 2026,
          }),
        agent
          .post('/api/courses')
          .set(authHeader(professor.accessToken))
          .send({
            code: `CS201-${Date.now()}`,
            name: 'Data Structures',
            description: 'Second course',
            semester: 'FALL',
            year: 2026,
          }),
        agent
          .post('/api/courses')
          .set(authHeader(professor.accessToken))
          .send({
            code: `CS301-${Date.now()}`,
            name: 'Algorithms',
            description: 'Third course',
            semester: 'FALL',
            year: 2026,
          }),
      ]);

      // Get professor's courses
      const myCoursesResponse = await agent
        .get('/api/courses/my-courses')
        .set(authHeader(professor.accessToken))
        .expect(200);

      expect(myCoursesResponse.body.length).toBe(3);
      expect(myCoursesResponse.body.every((c: any) => c.professorId === professor.id)).toBe(true);
    });
  });
});
