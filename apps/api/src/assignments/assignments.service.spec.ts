import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService } from '../../test/mocks/prisma.mock';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const professorId = 'test-professor-id-123';
  const courseId = 'test-course-id-456';
  const assignmentId = 'test-assignment-id-789';
  const rubricId = 'test-rubric-id-101';

  const mockCourse = {
    id: courseId,
    name: 'Test Course',
    code: 'TEST101',
    professorId,
    description: 'Test description',
    semester: 'Spring',
    year: 2026,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRubric = {
    id: rubricId,
    name: 'Test Rubric',
    description: 'Test rubric description',
    totalPoints: 100,
    passingGrade: 60,
    courseId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAssignment = {
    id: assignmentId,
    title: 'Test Assignment',
    description: 'Test assignment description',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxSubmissions: 5,
    allowLateSubmissions: false,
    isPublished: false,
    courseId,
    rubricId,
    createdAt: new Date(),
    updatedAt: new Date(),
    course: {
      id: courseId,
      name: 'Test Course',
      code: 'TEST101',
    },
    rubric: {
      id: rubricId,
      name: 'Test Rubric',
      totalPoints: 100,
    },
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateAssignmentDto = {
      title: 'New Assignment',
      description: 'Assignment description',
      courseId,
      rubricId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      maxSubmissions: 5,
      allowLateSubmissions: false,
    };

    it('should successfully create an assignment', async () => {
      prismaService.course.findUnique.mockResolvedValue(mockCourse);
      prismaService.rubric.findUnique.mockResolvedValue(mockRubric);
      prismaService.assignment.create.mockResolvedValue(mockAssignment);

      const result = await service.create(professorId, createDto);

      expect(prismaService.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId },
      });
      expect(prismaService.rubric.findUnique).toHaveBeenCalledWith({
        where: { id: rubricId },
      });
      expect(prismaService.assignment.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title', mockAssignment.title);
    });

    it('should throw NotFoundException if course not found', async () => {
      prismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.create(professorId, createDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId },
      });
    });

    it('should throw ForbiddenException if professor does not own the course', async () => {
      const otherProfessorCourse = { ...mockCourse, professorId: 'other-professor-id' };
      prismaService.course.findUnique.mockResolvedValue(otherProfessorCourse);

      await expect(service.create(professorId, createDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if due date is in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const pastDueDto = { ...createDto, dueDate: pastDate.toISOString() };

      prismaService.course.findUnique.mockResolvedValue(mockCourse);

      await expect(service.create(professorId, pastDueDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(professorId, pastDueDto)).rejects.toThrow(
        'Due date must be in the future',
      );
    });

    it('should throw NotFoundException if rubric not found', async () => {
      prismaService.course.findUnique.mockResolvedValue(mockCourse);
      prismaService.rubric.findUnique.mockResolvedValue(null);

      await expect(service.create(professorId, createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(professorId, createDto)).rejects.toThrow('Rubric not found');
    });

    it('should throw BadRequestException if rubricId is not provided', async () => {
      const noRubricDto = { ...createDto, rubricId: undefined };
      prismaService.course.findUnique.mockResolvedValue(mockCourse);

      await expect(service.create(professorId, noRubricDto as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(professorId, noRubricDto as any)).rejects.toThrow(
        'Rubric ID is required to create an assignment',
      );
    });

    it('should use default maxSubmissions value if not provided', async () => {
      const dtoWithoutMax = { ...createDto, maxSubmissions: undefined };
      prismaService.course.findUnique.mockResolvedValue(mockCourse);
      prismaService.rubric.findUnique.mockResolvedValue(mockRubric);
      prismaService.assignment.create.mockResolvedValue(mockAssignment);

      await service.create(professorId, dtoWithoutMax);

      expect(prismaService.assignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            maxSubmissions: 5,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all assignments', async () => {
      const mockAssignments = [
        { ...mockAssignment, submissions: [] },
        { ...mockAssignment, id: 'assignment-2', submissions: [] },
      ];
      prismaService.assignment.findMany.mockResolvedValue(mockAssignments);

      const result = await service.findAll();

      expect(prismaService.assignment.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findByCourse', () => {
    it('should return assignments for a specific course', async () => {
      const mockAssignments = [{ ...mockAssignment, submissions: [] }];
      prismaService.assignment.findMany.mockResolvedValue(mockAssignments);

      const result = await service.findByCourse(courseId);

      expect(prismaService.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a single assignment by ID', async () => {
      const fullMockAssignment = {
        ...mockAssignment,
        course: {
          ...mockAssignment.course,
          professor: {
            id: professorId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
        },
        rubric: {
          ...mockAssignment.rubric,
          description: 'Test rubric',
          passingGrade: 60,
        },
        submissions: [],
        testSuites: [],
      };
      prismaService.assignment.findUnique.mockResolvedValue(fullMockAssignment);

      const result = await service.findOne(assignmentId);

      expect(prismaService.assignment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: assignmentId },
        }),
      );
      expect(result).toHaveProperty('id', assignmentId);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      prismaService.assignment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(assignmentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAssignmentDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should successfully update an assignment', async () => {
      const assignmentWithCourse = { ...mockAssignment, course: mockCourse };
      const updatedAssignment = { ...mockAssignment, ...updateDto };

      prismaService.assignment.findUnique.mockResolvedValue(assignmentWithCourse);
      prismaService.assignment.update.mockResolvedValue(updatedAssignment);

      const result = await service.update(assignmentId, professorId, updateDto);

      expect(prismaService.assignment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: assignmentId },
        }),
      );
      expect(prismaService.assignment.update).toHaveBeenCalled();
      expect(result).toHaveProperty('title', updateDto.title);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      prismaService.assignment.findUnique.mockResolvedValue(null);

      await expect(service.update(assignmentId, professorId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if professor does not own the course', async () => {
      const otherProfessorCourse = { ...mockCourse, professorId: 'other-professor-id' };
      const assignmentWithOtherCourse = {
        ...mockAssignment,
        course: otherProfessorCourse,
      };
      prismaService.assignment.findUnique.mockResolvedValue(assignmentWithOtherCourse);

      await expect(service.update(assignmentId, professorId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(assignmentId, professorId, updateDto)).rejects.toThrow(
        'You can only update your own assignments',
      );
    });

    it('should throw BadRequestException if updating due date to past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pastDueDto = { dueDate: pastDate.toISOString() };
      const assignmentWithCourse = { ...mockAssignment, course: mockCourse };

      prismaService.assignment.findUnique.mockResolvedValue(assignmentWithCourse);

      await expect(service.update(assignmentId, professorId, pastDueDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(assignmentId, professorId, pastDueDto)).rejects.toThrow(
        'Due date must be in the future',
      );
    });
  });

  describe('publish', () => {
    it('should successfully publish an assignment', async () => {
      const assignmentWithCourse = { ...mockAssignment, course: mockCourse };
      const publishedAssignment = { ...mockAssignment, isPublished: true };

      prismaService.assignment.findUnique.mockResolvedValue(assignmentWithCourse);
      prismaService.assignment.update.mockResolvedValue(publishedAssignment);

      const result = await service.publish(assignmentId, professorId);

      expect(prismaService.assignment.findUnique).toHaveBeenCalled();
      expect(prismaService.assignment.update).toHaveBeenCalledWith({
        where: { id: assignmentId },
        data: { isPublished: true },
        include: expect.anything(),
      });
      expect(result).toHaveProperty('isPublished', true);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      prismaService.assignment.findUnique.mockResolvedValue(null);

      await expect(service.publish(assignmentId, professorId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if professor does not own the course', async () => {
      const otherProfessorCourse = { ...mockCourse, professorId: 'other-professor-id' };
      const assignmentWithOtherCourse = {
        ...mockAssignment,
        course: otherProfessorCourse,
      };
      prismaService.assignment.findUnique.mockResolvedValue(assignmentWithOtherCourse);

      await expect(service.publish(assignmentId, professorId)).rejects.toThrow(ForbiddenException);
      await expect(service.publish(assignmentId, professorId)).rejects.toThrow(
        'You can only publish your own assignments',
      );
    });
  });

  describe('remove', () => {
    it('should successfully delete an assignment', async () => {
      const assignmentWithCourse = {
        ...mockAssignment,
        course: mockCourse,
        submissions: [], // Empty submissions array
      };

      prismaService.assignment.findUnique.mockResolvedValue(assignmentWithCourse);
      prismaService.assignment.delete.mockResolvedValue(mockAssignment);

      const result = await service.remove(assignmentId, professorId);

      expect(prismaService.assignment.findUnique).toHaveBeenCalled();
      expect(prismaService.assignment.delete).toHaveBeenCalledWith({
        where: { id: assignmentId },
      });
      expect(result).toHaveProperty('message', 'Assignment deleted successfully');
    });

    it('should throw NotFoundException if assignment not found', async () => {
      prismaService.assignment.findUnique.mockResolvedValue(null);

      await expect(service.remove(assignmentId, professorId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if professor does not own the course', async () => {
      const otherProfessorCourse = { ...mockCourse, professorId: 'other-professor-id' };
      const assignmentWithOtherCourse = {
        ...mockAssignment,
        course: otherProfessorCourse,
      };
      prismaService.assignment.findUnique.mockResolvedValue(assignmentWithOtherCourse);

      await expect(service.remove(assignmentId, professorId)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(assignmentId, professorId)).rejects.toThrow(
        'You can only delete your own assignments',
      );
    });
  });
});
