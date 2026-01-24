import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateRubricWithCriteriaDto,
  UpdateRubricDto,
  RubricResponseDto,
} from './dto';
import { RubricValidationService } from './rubric-validation.service';

@Injectable()
export class RubricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: RubricValidationService,
  ) {}

  async create(dto: CreateRubricWithCriteriaDto): Promise<RubricResponseDto> {
    // Validate point totals match
    const sumOfMaxPoints = dto.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
    if (sumOfMaxPoints !== dto.rubric.totalPoints) {
      throw new BadRequestException(
        `Sum of criteria maxPoints (${sumOfMaxPoints}) does not equal rubric totalPoints (${dto.rubric.totalPoints})`,
      );
    }

    // Create rubric with criteria in a transaction
    const rubric = await this.prisma.$transaction(async (tx) => {
      // Create rubric
      const newRubric = await tx.rubric.create({
        data: {
          name: dto.rubric.name,
          description: dto.rubric.description,
          totalPoints: dto.rubric.totalPoints,
          passingGrade: dto.rubric.passingGrade,
          metadata: dto.rubric.metadata || {},
        },
      });

      // Create criteria
      await Promise.all(
        dto.criteria.map((criterion, index) =>
          tx.criterion.create({
            data: {
              title: criterion.title,
              maxPoints: criterion.maxPoints,
              weight: criterion.weight || 1.0,
              evaluationMethod: criterion.evaluationMethod,
              unitTestWeight: criterion.unitTestWeight || 0,
              gptWeight: criterion.gptWeight || 1.0,
              gptInstructions: criterion.gptInstructions,
              filesToAnalyze: criterion.filesToAnalyze || [],
              levels: criterion.levels,
              order: criterion.order ?? index,
              rubricId: newRubric.id,
            },
          }),
        ),
      );

      // Fetch complete rubric with criteria
      return tx.rubric.findUnique({
        where: { id: newRubric.id },
        include: {
          criteria: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    return this.toResponseDto(rubric);
  }

  async uploadFromJson(jsonContent: string): Promise<RubricResponseDto> {
    // Parse JSON
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(jsonContent);
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }

    // Validate JSON structure
    const validatedJson = this.validationService.validateRubricJson(parsedJson);

    // Create rubric with criteria
    return this.create({
      rubric: validatedJson.rubric,
      criteria: validatedJson.criteria,
    });
  }

  async findAll(): Promise<RubricResponseDto[]> {
    const rubrics = await this.prisma.rubric.findMany({
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

    return rubrics.map((rubric) => this.toResponseDto(rubric));
  }

  async findOne(id: string): Promise<RubricResponseDto> {
    const rubric = await this.prisma.rubric.findUnique({
      where: { id },
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

    if (!rubric) {
      throw new NotFoundException('Rubric not found');
    }

    return this.toResponseDto(rubric);
  }

  async update(id: string, dto: UpdateRubricDto): Promise<RubricResponseDto> {
    // Check if rubric exists
    const rubric = await this.prisma.rubric.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!rubric) {
      throw new NotFoundException('Rubric not found');
    }

    // Don't allow updates if rubric is linked to an assignment
    if (rubric.assignment) {
      throw new BadRequestException('Cannot update rubric that is linked to an assignment');
    }

    const updated = await this.prisma.rubric.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.totalPoints && { totalPoints: dto.totalPoints }),
        ...(dto.passingGrade !== undefined && { passingGrade: dto.passingGrade }),
        ...(dto.metadata && { metadata: dto.metadata }),
      },
      include: {
        criteria: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.toResponseDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if rubric exists
    const rubric = await this.prisma.rubric.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!rubric) {
      throw new NotFoundException('Rubric not found');
    }

    // Don't allow deletion if rubric is linked to an assignment
    if (rubric.assignment) {
      throw new BadRequestException('Cannot delete rubric that is linked to an assignment');
    }

    // Delete rubric (criteria will be cascade deleted)
    await this.prisma.rubric.delete({
      where: { id },
    });

    return { message: 'Rubric deleted successfully' };
  }

  private toResponseDto(rubric: any): RubricResponseDto {
    return {
      id: rubric.id,
      name: rubric.name,
      description: rubric.description,
      totalPoints: rubric.totalPoints,
      passingGrade: rubric.passingGrade,
      metadata: rubric.metadata,
      createdAt: rubric.createdAt,
      updatedAt: rubric.updatedAt,
      criteria: rubric.criteria?.map((c: any) => ({
        id: c.id,
        title: c.title,
        maxPoints: c.maxPoints,
        weight: c.weight,
        evaluationMethod: c.evaluationMethod,
        unitTestWeight: c.unitTestWeight,
        gptWeight: c.gptWeight,
        gptInstructions: c.gptInstructions,
        filesToAnalyze: c.filesToAnalyze,
        levels: c.levels,
        order: c.order,
      })),
      assignment: rubric.assignment,
    };
  }
}
