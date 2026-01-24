/**
 * Test Data Factories
 * Generates consistent test data for unit and integration tests
 */

import { UserRole } from '@prisma/client';

// User Factory
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id-123',
  email: 'test@example.com',
  passwordHash: '$2a$10$hashedpassword123456789',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.STUDENT,
  githubUsername: 'testuser',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

export const createMockProfessor = (overrides = {}) =>
  createMockUser({
    id: 'test-professor-id-123',
    email: 'professor@example.com',
    firstName: 'Professor',
    lastName: 'Smith',
    role: UserRole.PROFESSOR,
    ...overrides,
  });

export const createMockStudent = (overrides = {}) =>
  createMockUser({
    id: 'test-student-id-123',
    email: 'student@example.com',
    firstName: 'Student',
    lastName: 'Jones',
    role: UserRole.STUDENT,
    ...overrides,
  });

export const createMockAdmin = (overrides = {}) =>
  createMockUser({
    id: 'test-admin-id-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    ...overrides,
  });

// Course Factory
export const createMockCourse = (overrides = {}) => ({
  id: 'test-course-id-123',
  name: 'Introduction to Computer Science',
  code: 'CS101',
  description: 'An introductory course to computer science',
  semester: 'Spring',
  year: 2026,
  isActive: true,
  professorId: 'test-professor-id-123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// Assignment Factory
export const createMockAssignment = (overrides = {}) => ({
  id: 'test-assignment-id-123',
  title: 'Project 1: REST API',
  description: 'Build a REST API with Node.js',
  dueDate: new Date('2026-02-15'),
  maxSubmissions: 5,
  allowLateSubmissions: false,
  isPublished: true,
  courseId: 'test-course-id-123',
  rubricId: 'test-rubric-id-123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// Rubric Factory
export const createMockRubric = (overrides = {}) => ({
  id: 'test-rubric-id-123',
  name: 'REST API Rubric',
  description: 'Grading rubric for REST API project',
  totalPoints: 100,
  passingGrade: 60,
  metadata: {
    techStack: ['Node.js', 'Express', 'MongoDB'],
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// Criterion Factory
export const createMockCriterion = (overrides = {}) => ({
  id: 'test-criterion-id-123',
  title: 'API Endpoints',
  maxPoints: 20,
  weight: 1.0,
  evaluationMethod: 'hybrid',
  unitTestWeight: 0.5,
  gptWeight: 0.5,
  gptInstructions: 'Evaluate the API endpoint implementation',
  filesToAnalyze: ['src/routes/*.js'],
  levels: {
    excellent: 'All endpoints properly implemented',
    good: 'Most endpoints implemented correctly',
    fair: 'Some endpoints working',
    poor: 'Major issues with endpoints',
  },
  order: 1,
  rubricId: 'test-rubric-id-123',
  ...overrides,
});

// Enrollment Factory
export const createMockEnrollment = (overrides = {}) => ({
  id: 'test-enrollment-id-123',
  studentId: 'test-student-id-123',
  courseId: 'test-course-id-123',
  enrolledAt: new Date('2026-01-01'),
  ...overrides,
});

// Submission Factory
export const createMockSubmission = (overrides = {}) => ({
  id: 'test-submission-id-123',
  githubRepoUrl: 'https://github.com/student/project',
  commitHash: 'abc123def456',
  status: 'PENDING',
  attemptNumber: 1,
  submittedAt: new Date('2026-01-15'),
  gradingStartedAt: null,
  gradingCompletedAt: null,
  totalScore: null,
  maxScore: null,
  percentage: null,
  letterGrade: null,
  buildSuccess: null,
  metadata: null,
  errorMessage: null,
  studentId: 'test-student-id-123',
  assignmentId: 'test-assignment-id-123',
  ...overrides,
});

// Auth Response Factory
export const createMockAuthResponse = (userOverrides = {}) => ({
  accessToken: 'mock.jwt.token',
  user: {
    id: 'test-user-id-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.STUDENT,
    ...userOverrides,
  },
});

// DTO Factories
export const createRegisterDto = (overrides = {}) => ({
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  firstName: 'New',
  lastName: 'User',
  role: UserRole.STUDENT,
  ...overrides,
});

export const createLoginDto = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'TestPassword123!',
  ...overrides,
});

export const createCreateUserDto = (overrides = {}) => ({
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  firstName: 'New',
  lastName: 'User',
  role: UserRole.STUDENT,
  githubUsername: 'newuser',
  ...overrides,
});

export const createUpdateUserDto = (overrides = {}) => ({
  firstName: 'Updated',
  lastName: 'Name',
  ...overrides,
});

export const createCreateCourseDto = (overrides = {}) => ({
  name: 'New Course',
  code: 'CS201',
  description: 'A new course description',
  semester: 'Fall',
  year: 2026,
  ...overrides,
});
