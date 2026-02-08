import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto';
import { UserRole } from '@autograder/database';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let service: AssignmentsService;

  const mockAssignmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByCourse: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    remove: jest.fn(),
  };

  const mockProfessor = {
    id: 'test-professor-id',
    email: 'professor@test.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.PROFESSOR,
  };

  const mockAssignment = {
    id: 'test-assignment-id',
    title: 'Test Assignment',
    description: 'Test description',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxSubmissions: 5,
    allowLateSubmissions: false,
    isPublished: false,
    courseId: 'test-course-id',
    rubricId: 'test-rubric-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    course: {
      id: 'test-course-id',
      name: 'Test Course',
      code: 'TEST101',
    },
    rubric: {
      id: 'test-rubric-id',
      name: 'Test Rubric',
      totalPoints: 100,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentsService,
          useValue: mockAssignmentsService,
        },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
    service = module.get<AssignmentsService>(AssignmentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new assignment', async () => {
      const createDto: CreateAssignmentDto = {
        title: 'New Assignment',
        description: 'Assignment description',
        courseId: 'test-course-id',
        rubricId: 'test-rubric-id',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxSubmissions: 5,
        allowLateSubmissions: false,
      };

      mockAssignmentsService.create.mockResolvedValue(mockAssignment);

      const result = await controller.create(mockProfessor as any, createDto);

      expect(service.create).toHaveBeenCalledWith(mockProfessor.id, createDto);
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('findAll', () => {
    it('should return an array of assignments', async () => {
      const mockAssignments = [mockAssignment, { ...mockAssignment, id: 'assignment-2' }];

      mockAssignmentsService.findAll.mockResolvedValue(mockAssignments);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockAssignments);
      expect(result).toHaveLength(2);
    });
  });

  describe('findByCourse', () => {
    it('should return assignments for a specific course', async () => {
      const courseId = 'test-course-id';
      const mockAssignments = [mockAssignment];

      mockAssignmentsService.findByCourse.mockResolvedValue(mockAssignments);

      const result = await controller.findByCourse(courseId);

      expect(service.findByCourse).toHaveBeenCalledWith(courseId);
      expect(result).toEqual(mockAssignments);
    });
  });

  describe('findOne', () => {
    it('should return a single assignment by ID', async () => {
      const assignmentId = 'test-assignment-id';

      mockAssignmentsService.findOne.mockResolvedValue(mockAssignment);

      const result = await controller.findOne(assignmentId);

      expect(service.findOne).toHaveBeenCalledWith(assignmentId);
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('update', () => {
    it('should update an assignment', async () => {
      const assignmentId = 'test-assignment-id';
      const updateDto: UpdateAssignmentDto = {
        title: 'Updated Title',
        description: 'Updated description',
      };
      const updatedAssignment = { ...mockAssignment, ...updateDto };

      mockAssignmentsService.update.mockResolvedValue(updatedAssignment);

      const result = await controller.update(mockProfessor as any, assignmentId, updateDto);

      expect(service.update).toHaveBeenCalledWith(assignmentId, mockProfessor.id, updateDto);
      expect(result).toEqual(updatedAssignment);
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('publish', () => {
    it('should publish an assignment', async () => {
      const assignmentId = 'test-assignment-id';
      const publishedAssignment = { ...mockAssignment, isPublished: true };

      mockAssignmentsService.publish.mockResolvedValue(publishedAssignment);

      const result = await controller.publish(mockProfessor as any, assignmentId);

      expect(service.publish).toHaveBeenCalledWith(assignmentId, mockProfessor.id);
      expect(result).toEqual(publishedAssignment);
      expect(result.isPublished).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete an assignment', async () => {
      const assignmentId = 'test-assignment-id';
      const deleteResult = { message: 'Assignment deleted successfully' };

      mockAssignmentsService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(mockProfessor as any, assignmentId);

      expect(service.remove).toHaveBeenCalledWith(assignmentId, mockProfessor.id);
      expect(result).toEqual(deleteResult);
      expect(result.message).toBe('Assignment deleted successfully');
    });
  });
});
