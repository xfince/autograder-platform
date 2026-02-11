import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RubricsService } from './rubrics.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RubricValidationService } from './rubric-validation.service';
import { CreateRubricWithCriteriaDto, UpdateRubricDto } from './dto';

describe('RubricsService', () => {
  let service: RubricsService;
  let prisma: PrismaService;
  let validationService: RubricValidationService;

  // Mock data
  const mockRubric = {
    id: 'test-rubric-id',
    name: 'Test Rubric',
    description: 'Test rubric description',
    totalPoints: 100,
    passingGrade: 70,
    metadata: { techStack: 'Node.js' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCriteria = [
    {
      id: 'criterion-1',
      title: 'Code Quality',
      maxPoints: 50,
      weight: 1.0,
      evaluationMethod: 'gpt_semantic',
      unitTestWeight: 0,
      gptWeight: 1.0,
      gptInstructions: 'Evaluate code quality',
      filesToAnalyze: ['src/**/*.ts'],
      levels: { excellent: 'Great', good: 'Nice', fair: 'OK', poor: 'Bad' },
      order: 0,
      rubricId: 'test-rubric-id',
    },
    {
      id: 'criterion-2',
      title: 'Functionality',
      maxPoints: 50,
      weight: 1.0,
      evaluationMethod: 'unit_test',
      unitTestWeight: 1.0,
      gptWeight: 0,
      gptInstructions: 'Check functionality',
      filesToAnalyze: ['src/**/*.ts'],
      levels: { excellent: 'Great', good: 'Nice', fair: 'OK', poor: 'Bad' },
      order: 1,
      rubricId: 'test-rubric-id',
    },
  ];

  const mockRubricWithCriteria = {
    ...mockRubric,
    criteria: mockCriteria,
  };

  const mockPrismaService = {
    rubric: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    criterion: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockValidationService = {
    validateRubricJson: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RubricsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RubricValidationService,
          useValue: mockValidationService,
        },
      ],
    }).compile();

    service = module.get<RubricsService>(RubricsService);
    prisma = module.get<PrismaService>(PrismaService);
    validationService = module.get<RubricValidationService>(RubricValidationService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateRubricWithCriteriaDto = {
      rubric: {
        name: 'Test Rubric',
        description: 'Test description',
        totalPoints: 100,
        passingGrade: 70,
        metadata: { techStack: 'Node.js' },
      },
      criteria: [
        {
          title: 'Code Quality',
          maxPoints: 50,
          weight: 1.0,
          evaluationMethod: 'gpt_semantic',
          unitTestWeight: 0,
          gptWeight: 1.0,
          gptInstructions: 'Evaluate code quality',
          filesToAnalyze: ['src/**/*.ts'],
          levels: { excellent: 'Great', good: 'Nice', fair: 'OK', poor: 'Bad' },
          order: 0,
        },
        {
          title: 'Functionality',
          maxPoints: 50,
          weight: 1.0,
          evaluationMethod: 'unit_test',
          unitTestWeight: 1.0,
          gptWeight: 0,
          gptInstructions: 'Check functionality',
          filesToAnalyze: ['src/**/*.ts'],
          levels: { excellent: 'Great', good: 'Nice', fair: 'OK', poor: 'Bad' },
          order: 1,
        },
      ],
    };

    it('should successfully create a rubric with criteria', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          rubric: {
            create: jest.fn().mockResolvedValue(mockRubric),
            findUnique: jest.fn().mockResolvedValue(mockRubricWithCriteria),
          },
          criterion: {
            create: jest.fn().mockResolvedValue(mockCriteria[0]),
          },
        });
      });

      const result = await service.create(createDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('test-rubric-id');
      expect(result.name).toBe('Test Rubric');
      expect(result.criteria).toHaveLength(2);
    });

    it('should throw BadRequestException if point totals do not match', async () => {
      const invalidDto: CreateRubricWithCriteriaDto = {
        ...createDto,
        criteria: [
          {
            ...createDto.criteria[0],
            maxPoints: 30, // Total = 80, but totalPoints = 100
          },
          {
            ...createDto.criteria[1],
            maxPoints: 50,
          },
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Sum of criteria maxPoints (80) does not equal rubric totalPoints (100)',
      );
    });

    it('should handle transaction failure gracefully', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(service.create(createDto)).rejects.toThrow('Transaction failed');
    });

    it('should throw NotFoundException if rubric not found after creation', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          rubric: {
            create: jest.fn().mockResolvedValue(mockRubric),
            findUnique: jest.fn().mockResolvedValue(null),
          },
          criterion: {
            create: jest.fn().mockResolvedValue(mockCriteria[0]),
          },
        });
      });

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Rubric not found');
    });
  });

  describe('uploadFromJson', () => {
    const validJsonContent = JSON.stringify({
      rubric: {
        name: 'Test Rubric',
        description: 'Test description',
        totalPoints: 100,
        passingGrade: 70,
        metadata: { techStack: 'Node.js' },
      },
      criteria: [
        {
          title: 'Code Quality',
          maxPoints: 50,
          weight: 1.0,
          evaluationMethod: 'gpt_semantic',
          unitTestWeight: 0,
          gptWeight: 1.0,
          gptInstructions: 'Evaluate code quality',
          filesToAnalyze: ['src/**/*.ts'],
          levels: { excellent: 'Great', good: 'Nice', fair: 'OK', poor: 'Bad' },
          order: 0,
        },
        {
          title: 'Functionality',
          maxPoints: 50,
          weight: 1.0,
          evaluationMethod: 'unit_test',
          unitTestWeight: 1.0,
          gptWeight: 0,
          gptInstructions: 'Check functionality',
          filesToAnalyze: ['src/**/*.ts'],
          levels: { excellent: 'Great', good: 'Nice', fair: 'OK', poor: 'Bad' },
          order: 1,
        },
      ],
    });

    it('should parse valid JSON and create rubric', async () => {
      const parsedJson = JSON.parse(validJsonContent);
      mockValidationService.validateRubricJson.mockReturnValue(parsedJson);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          rubric: {
            create: jest.fn().mockResolvedValue(mockRubric),
            findUnique: jest.fn().mockResolvedValue(mockRubricWithCriteria),
          },
          criterion: {
            create: jest.fn().mockResolvedValue(mockCriteria[0]),
          },
        });
      });

      const result = await service.uploadFromJson(validJsonContent);

      expect(mockValidationService.validateRubricJson).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Rubric');
    });

    it('should throw BadRequestException for invalid JSON format', async () => {
      const invalidJson = 'not valid json {';

      await expect(service.uploadFromJson(invalidJson)).rejects.toThrow(BadRequestException);
      await expect(service.uploadFromJson(invalidJson)).rejects.toThrow('Invalid JSON format');
    });

    it('should throw BadRequestException for invalid structure', async () => {
      const invalidStructureJson = JSON.stringify({ invalid: 'structure' });
      mockValidationService.validateRubricJson.mockImplementation(() => {
        throw new BadRequestException('Invalid rubric structure');
      });

      await expect(service.uploadFromJson(invalidStructureJson)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all rubrics with criteria', async () => {
      const mockRubrics = [
        mockRubricWithCriteria,
        {
          ...mockRubricWithCriteria,
          id: 'rubric-2',
          name: 'Another Rubric',
        },
      ];

      mockPrismaService.rubric.findMany.mockResolvedValue(mockRubrics);

      const result = await service.findAll();

      expect(mockPrismaService.rubric.findMany).toHaveBeenCalledWith({
        include: {
          criteria: {
            orderBy: { order: 'asc' },
          },
          assignment: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Rubric');
    });

    it('should return empty array if no rubrics exist', async () => {
      mockPrismaService.rubric.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single rubric by ID', async () => {
      mockPrismaService.rubric.findUnique.mockResolvedValue(mockRubricWithCriteria);

      const result = await service.findOne('test-rubric-id');

      expect(mockPrismaService.rubric.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-rubric-id' },
        include: {
          criteria: {
            orderBy: { order: 'asc' },
          },
          assignment: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      expect(result.id).toBe('test-rubric-id');
      expect(result.name).toBe('Test Rubric');
    });

    it('should throw NotFoundException if rubric not found', async () => {
      mockPrismaService.rubric.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow('Rubric not found');
    });
  });

  describe('update', () => {
    const updateDto: UpdateRubricDto = {
      name: 'Updated Rubric',
      description: 'Updated description',
      totalPoints: 120,
      passingGrade: 80,
    };

    it('should successfully update a rubric', async () => {
      const rubricWithoutAssignment = {
        ...mockRubricWithCriteria,
        assignment: null,
      };

      mockPrismaService.rubric.findUnique.mockResolvedValue(rubricWithoutAssignment);

      const updatedRubric = {
        ...mockRubricWithCriteria,
        ...updateDto,
      };
      mockPrismaService.rubric.update.mockResolvedValue(updatedRubric);

      const result = await service.update('test-rubric-id', updateDto);

      expect(mockPrismaService.rubric.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-rubric-id' },
        include: { assignment: true },
      });
      expect(mockPrismaService.rubric.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated Rubric');
    });

    it('should throw NotFoundException if rubric does not exist', async () => {
      mockPrismaService.rubric.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(
        'Rubric not found',
      );
    });

    it('should throw BadRequestException if rubric is linked to an assignment', async () => {
      const rubricWithAssignment = {
        ...mockRubricWithCriteria,
        assignment: {
          id: 'assignment-id',
          title: 'Test Assignment',
        },
      };

      mockPrismaService.rubric.findUnique.mockResolvedValue(rubricWithAssignment);

      await expect(service.update('test-rubric-id', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('test-rubric-id', updateDto)).rejects.toThrow(
        'Cannot update rubric that is linked to an assignment',
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdateDto: UpdateRubricDto = {
        name: 'Partially Updated',
      };

      const rubricWithoutAssignment = {
        ...mockRubricWithCriteria,
        assignment: null,
      };

      mockPrismaService.rubric.findUnique.mockResolvedValue(rubricWithoutAssignment);

      const updatedRubric = {
        ...mockRubricWithCriteria,
        name: 'Partially Updated',
      };
      mockPrismaService.rubric.update.mockResolvedValue(updatedRubric);

      const result = await service.update('test-rubric-id', partialUpdateDto);

      expect(result.name).toBe('Partially Updated');
    });
  });

  describe('remove', () => {
    it('should successfully delete a rubric', async () => {
      const rubricWithoutAssignment = {
        ...mockRubricWithCriteria,
        assignment: null,
      };

      mockPrismaService.rubric.findUnique.mockResolvedValue(rubricWithoutAssignment);
      mockPrismaService.rubric.delete.mockResolvedValue(mockRubric);

      const result = await service.remove('test-rubric-id');

      expect(mockPrismaService.rubric.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-rubric-id' },
        include: { assignment: true },
      });
      expect(mockPrismaService.rubric.delete).toHaveBeenCalledWith({
        where: { id: 'test-rubric-id' },
      });
      expect(result.message).toBe('Rubric deleted successfully');
    });

    it('should throw NotFoundException if rubric does not exist', async () => {
      mockPrismaService.rubric.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('non-existent-id')).rejects.toThrow('Rubric not found');
    });

    it('should throw BadRequestException if rubric is linked to an assignment', async () => {
      const rubricWithAssignment = {
        ...mockRubricWithCriteria,
        assignment: {
          id: 'assignment-id',
          title: 'Test Assignment',
        },
      };

      mockPrismaService.rubric.findUnique.mockResolvedValue(rubricWithAssignment);

      await expect(service.remove('test-rubric-id')).rejects.toThrow(BadRequestException);
      await expect(service.remove('test-rubric-id')).rejects.toThrow(
        'Cannot delete rubric that is linked to an assignment',
      );
    });
  });
});
