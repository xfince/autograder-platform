import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RubricsController } from './rubrics.controller';
import { RubricsService } from './rubrics.service';
import { CreateRubricWithCriteriaDto, UpdateRubricDto, RubricResponseDto } from './dto';

describe('RubricsController', () => {
  let controller: RubricsController;
  let service: RubricsService;

  // Mock data
  const mockRubricResponse: RubricResponseDto = {
    id: 'test-rubric-id',
    name: 'Test Rubric',
    description: 'Test description',
    totalPoints: 100,
    passingGrade: 70,
    metadata: { techStack: 'Node.js' },
    createdAt: new Date(),
    updatedAt: new Date(),
    criteria: [
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
      },
    ],
  };

  const mockRubricsService = {
    create: jest.fn(),
    uploadFromJson: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RubricsController],
      providers: [
        {
          provide: RubricsService,
          useValue: mockRubricsService,
        },
      ],
    }).compile();

    controller = module.get<RubricsController>(RubricsController);
    service = module.get<RubricsService>(RubricsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new rubric with criteria', async () => {
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

      mockRubricsService.create.mockResolvedValue(mockRubricResponse);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockRubricResponse);
      expect(result.name).toBe('Test Rubric');
      expect(result.criteria).toHaveLength(2);
    });
  });

  describe('uploadJson', () => {
    it('should upload rubric from JSON file', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'rubric.json',
        encoding: '7bit',
        mimetype: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({
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
          }),
        ),
        size: 1000,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      mockRubricsService.uploadFromJson.mockResolvedValue(mockRubricResponse);

      const result = await controller.uploadJson(mockFile);

      expect(service.uploadFromJson).toHaveBeenCalled();
      expect(result).toEqual(mockRubricResponse);
    });

    it('should throw BadRequestException if no file uploaded', async () => {
      await expect(controller.uploadJson(undefined as any)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadJson(undefined as any)).rejects.toThrow('No file uploaded');
    });

    it('should throw BadRequestException if file is not JSON', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'rubric.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('not a json'),
        size: 1000,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(controller.uploadJson(mockFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadJson(mockFile)).rejects.toThrow('File must be a JSON file');
    });
  });

  describe('findAll', () => {
    it('should return an array of rubrics', async () => {
      const mockRubrics = [
        mockRubricResponse,
        {
          ...mockRubricResponse,
          id: 'rubric-2',
          name: 'Another Rubric',
        },
      ];

      mockRubricsService.findAll.mockResolvedValue(mockRubrics);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockRubrics);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a single rubric by ID', async () => {
      mockRubricsService.findOne.mockResolvedValue(mockRubricResponse);

      const result = await controller.findOne('test-rubric-id');

      expect(service.findOne).toHaveBeenCalledWith('test-rubric-id');
      expect(result).toEqual(mockRubricResponse);
      expect(result.id).toBe('test-rubric-id');
    });
  });

  describe('update', () => {
    it('should update a rubric', async () => {
      const updateDto: UpdateRubricDto = {
        name: 'Updated Rubric',
        description: 'Updated description',
        totalPoints: 120,
        passingGrade: 80,
      };

      const updatedRubric = {
        ...mockRubricResponse,
        ...updateDto,
      };

      mockRubricsService.update.mockResolvedValue(updatedRubric);

      const result = await controller.update('test-rubric-id', updateDto);

      expect(service.update).toHaveBeenCalledWith('test-rubric-id', updateDto);
      expect(result).toEqual(updatedRubric);
      expect(result.name).toBe('Updated Rubric');
    });
  });

  describe('remove', () => {
    it('should delete a rubric', async () => {
      const deleteResponse = { message: 'Rubric deleted successfully' };

      mockRubricsService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove('test-rubric-id');

      expect(service.remove).toHaveBeenCalledWith('test-rubric-id');
      expect(result).toEqual(deleteResponse);
      expect(result.message).toBe('Rubric deleted successfully');
    });
  });
});
