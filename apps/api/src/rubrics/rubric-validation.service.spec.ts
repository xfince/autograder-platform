import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RubricValidationService } from './rubric-validation.service';

describe('RubricValidationService', () => {
  let service: RubricValidationService;

  // Valid test data
  const validRubricJson = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RubricValidationService],
    }).compile();

    service = module.get<RubricValidationService>(RubricValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRubricJson', () => {
    it('should accept valid rubric JSON', () => {
      const result = service.validateRubricJson(validRubricJson as any);

      expect(result).toBeDefined();
      expect(result.rubric.name).toBe('Test Rubric');
      expect(result.criteria).toHaveLength(2);
    });

    it('should throw BadRequestException if rubric property is missing', () => {
      const invalidJson = {
        criteria: validRubricJson.criteria,
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Invalid rubric JSON: must have "rubric" and "criteria" properties',
      );
    });

    it('should throw BadRequestException if criteria property is missing', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Invalid rubric JSON: must have "rubric" and "criteria" properties',
      );
    });

    it('should validate all components successfully', () => {
      // This test ensures all validation methods are called
      expect(() => service.validateRubricJson(validRubricJson as any)).not.toThrow();
    });
  });

  describe('validateRubricFormat', () => {
    it('should throw BadRequestException if name is missing', () => {
      const invalidJson = {
        rubric: {
          totalPoints: 100,
          passingGrade: 70,
        },
        criteria: validRubricJson.criteria,
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Rubric must have a valid "name" string',
      );
    });

    it('should throw BadRequestException if totalPoints is not a positive number', () => {
      const invalidJson = {
        rubric: {
          name: 'Test Rubric',
          totalPoints: 0,
          passingGrade: 70,
        },
        criteria: validRubricJson.criteria,
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Rubric must have a valid "totalPoints" number greater than 0',
      );
    });

    it('should throw BadRequestException if passingGrade is negative', () => {
      const invalidJson = {
        rubric: {
          name: 'Test Rubric',
          totalPoints: 100,
          passingGrade: -10,
        },
        criteria: validRubricJson.criteria,
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Rubric must have a valid "passingGrade" number',
      );
    });

    it('should throw BadRequestException if passingGrade exceeds totalPoints', () => {
      const invalidJson = {
        rubric: {
          name: 'Test Rubric',
          totalPoints: 100,
          passingGrade: 150,
        },
        criteria: validRubricJson.criteria,
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Passing grade cannot exceed total points',
      );
    });
  });

  describe('validateCriteriaFormat', () => {
    it('should throw BadRequestException if criteria is empty array', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Criteria must be a non-empty array',
      );
    });

    it('should throw BadRequestException if criterion is missing title', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [
          {
            maxPoints: 50,
            evaluationMethod: 'gpt_semantic',
            gptInstructions: 'Test',
            levels: {},
          },
        ],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Criterion at index 0 must have a valid "title" string',
      );
    });

    it('should throw BadRequestException if criterion has invalid maxPoints', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [
          {
            title: 'Test Criterion',
            maxPoints: 0,
            evaluationMethod: 'gpt_semantic',
            gptInstructions: 'Test',
            levels: {},
          },
        ],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Criterion "Test Criterion" must have a valid "maxPoints" number greater than 0',
      );
    });

    it('should throw BadRequestException if criterion is missing evaluationMethod', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [
          {
            title: 'Test Criterion',
            maxPoints: 50,
            gptInstructions: 'Test',
            levels: {},
          },
        ],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Criterion "Test Criterion" must have a valid "evaluationMethod" string',
      );
    });

    it('should throw BadRequestException if criterion is missing gptInstructions', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [
          {
            title: 'Test Criterion',
            maxPoints: 50,
            evaluationMethod: 'gpt_semantic',
            levels: {},
          },
        ],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Criterion "Test Criterion" must have "gptInstructions" string',
      );
    });

    it('should throw BadRequestException if criterion is missing levels object', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [
          {
            title: 'Test Criterion',
            maxPoints: 50,
            evaluationMethod: 'gpt_semantic',
            gptInstructions: 'Test',
          },
        ],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Criterion "Test Criterion" must have "levels" object',
      );
    });
  });

  describe('validateEvaluationMethods', () => {
    it('should accept valid evaluation methods', () => {
      const validMethods = ['unit_test', 'gpt_semantic', 'hybrid'];

      validMethods.forEach((method) => {
        const json = {
          rubric: {
            ...validRubricJson.rubric,
            totalPoints: 50, // Match the single criterion's points
            passingGrade: 35, // Adjust to be less than totalPoints
          },
          criteria: [
            {
              ...validRubricJson.criteria[0],
              evaluationMethod: method,
              unitTestWeight: method === 'hybrid' ? 0.5 : 0,
              gptWeight: method === 'hybrid' ? 0.5 : 1.0,
            },
          ],
        };

        expect(() => service.validateRubricJson(json as any)).not.toThrow();
      });
    });

    it('should throw BadRequestException for invalid evaluation method', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [
          {
            ...validRubricJson.criteria[0],
            evaluationMethod: 'invalid_method',
          },
        ],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'has invalid evaluationMethod. Must be one of: unit_test, gpt_semantic, hybrid',
      );
    });

    it('should throw BadRequestException if hybrid weights do not sum to 1.0', () => {
      const invalidJson = {
        rubric: validRubricJson.rubric,
        criteria: [
          {
            ...validRubricJson.criteria[0],
            evaluationMethod: 'hybrid',
            unitTestWeight: 0.3,
            gptWeight: 0.5, // Sum = 0.8, not 1.0
          },
        ],
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'has invalid weights. unitTestWeight + gptWeight must equal 1.0',
      );
    });

    it('should accept hybrid method with correct weights', () => {
      const validJson = {
        rubric: {
          ...validRubricJson.rubric,
          totalPoints: 50, // Match the single criterion's points
          passingGrade: 35, // Adjust to be less than totalPoints
        },
        criteria: [
          {
            ...validRubricJson.criteria[0],
            evaluationMethod: 'hybrid',
            unitTestWeight: 0.4,
            gptWeight: 0.6,
          },
        ],
      };

      expect(() => service.validateRubricJson(validJson as any)).not.toThrow();
    });
  });

  describe('validatePointTotals', () => {
    it('should accept matching point totals', () => {
      expect(() => service.validateRubricJson(validRubricJson as any)).not.toThrow();
    });

    it('should throw BadRequestException if point totals do not match', () => {
      const invalidJson = {
        rubric: {
          ...validRubricJson.rubric,
          totalPoints: 120, // Criteria sum to 100
        },
        criteria: validRubricJson.criteria,
      };

      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(BadRequestException);
      expect(() => service.validateRubricJson(invalidJson as any)).toThrow(
        'Sum of criteria maxPoints (100) does not equal rubric totalPoints (120)',
      );
    });
  });
});
