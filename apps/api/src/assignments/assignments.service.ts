import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAssignmentDto, UpdateAssignmentDto, AssignmentResponseDto } from './dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(professorId: string, dto: CreateAssignmentDto): Promise<AssignmentResponseDto> {
    // Verify professor owns the course
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.professorId !== professorId) {
      throw new ForbiddenException('You can only create assignments for your own courses');
    }

    // Verify due date is in the future
    const dueDate = new Date(dto.dueDate);
    if (dueDate <= new Date()) {
      throw new BadRequestException('Due date must be in the future');
    }

    // Verify rubric exists if provided
    if (dto.rubricId) {
      const rubric = await this.prisma.rubric.findUnique({
        where: { id: dto.rubricId },
      });
      if (!rubric) {
        throw new NotFoundException('Rubric not found');
      }
    } else {
      throw new BadRequestException('Rubric ID is required to create an assignment');
    }

    // Create assignment
    const assignment = await this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dueDate,
        maxSubmissions: dto.maxSubmissions || 5,
        allowLateSubmissions: dto.allowLateSubmissions || false,
        isPublished: false,
        courseId: dto.courseId,
        rubricId: dto.rubricId,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        rubric: {
          select: {
            id: true,
            name: true,
            totalPoints: true,
          },
        },
      },
    });

    return this.toResponseDto(assignment);
  }

  async findAll(): Promise<AssignmentResponseDto[]> {
    const assignments = await this.prisma.assignment.findMany({
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        rubric: {
          select: {
            id: true,
            name: true,
            totalPoints: true,
          },
        },
        submissions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assignments.map((assignment) =>
      this.toResponseDto({
        ...assignment,
        submissionCount: assignment.submissions.length,
      }),
    );
  }

  async findByCourse(courseId: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        rubric: {
          select: {
            id: true,
            name: true,
            totalPoints: true,
          },
        },
        submissions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return assignments.map((assignment) =>
      this.toResponseDto({
        ...assignment,
        submissionCount: assignment.submissions.length,
      }),
    );
  }

  async findOne(id: string): Promise<AssignmentResponseDto> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            professor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        rubric: {
          select: {
            id: true,
            name: true,
            description: true,
            totalPoints: true,
            passingGrade: true,
          },
        },
        submissions: {
          select: {
            id: true,
            studentId: true,
          },
        },
        testSuites: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.toResponseDto({
      ...assignment,
      submissionCount: assignment.submissions.length,
    });
  }

  async update(
    id: string,
    professorId: string,
    dto: UpdateAssignmentDto,
  ): Promise<AssignmentResponseDto> {
    // Verify assignment exists and professor owns it
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.course.professorId !== professorId) {
      throw new ForbiddenException('You can only update your own assignments');
    }

    // If updating due date, verify it's in the future
    if (dto.dueDate) {
      const dueDate = new Date(dto.dueDate);
      if (dueDate <= new Date()) {
        throw new BadRequestException('Due date must be in the future');
      }
    }

    const updated = await this.prisma.assignment.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.maxSubmissions && { maxSubmissions: dto.maxSubmissions }),
        ...(dto.allowLateSubmissions !== undefined && {
          allowLateSubmissions: dto.allowLateSubmissions,
        }),
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        rubric: {
          select: {
            id: true,
            name: true,
            totalPoints: true,
          },
        },
      },
    });

    return this.toResponseDto(updated);
  }

  async publish(id: string, professorId: string): Promise<AssignmentResponseDto> {
    // Verify assignment exists and professor owns it
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.course.professorId !== professorId) {
      throw new ForbiddenException('You can only publish your own assignments');
    }

    // Verify assignment has a rubric before publishing
    if (!assignment.rubricId) {
      throw new BadRequestException('Cannot publish assignment without a rubric');
    }

    const published = await this.prisma.assignment.update({
      where: { id },
      data: {
        isPublished: true,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        rubric: {
          select: {
            id: true,
            name: true,
            totalPoints: true,
          },
        },
      },
    });

    return this.toResponseDto(published);
  }

  async remove(id: string, professorId: string): Promise<{ message: string }> {
    // Verify assignment exists and professor owns it
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
        submissions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.course.professorId !== professorId) {
      throw new ForbiddenException('You can only delete your own assignments');
    }

    // Warn if there are submissions
    if (assignment.submissions.length > 0) {
      throw new BadRequestException(
        `Cannot delete assignment with ${assignment.submissions.length} existing submissions`,
      );
    }

    await this.prisma.assignment.delete({
      where: { id },
    });

    return { message: 'Assignment deleted successfully' };
  }

  private toResponseDto(assignment: any): AssignmentResponseDto {
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      maxSubmissions: assignment.maxSubmissions,
      allowLateSubmissions: assignment.allowLateSubmissions,
      isPublished: assignment.isPublished,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      course: assignment.course,
      rubric: assignment.rubric,
      submissionCount: assignment.submissionCount,
      studentCount: assignment.studentCount,
    };
  }
}
