import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, EnrollStudentsDto, CourseResponseDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto, professorId: string): Promise<CourseResponseDto> {
    // Check if course code already exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { code: createCourseDto.code },
    });

    if (existingCourse) {
      throw new ConflictException('Course with this code already exists');
    }

    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        professorId,
      },
      include: {
        professor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.toResponseDto(course);
  }

  async findAll(): Promise<CourseResponseDto[]> {
    const courses = await this.prisma.course.findMany({
      include: {
        professor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => ({
      ...this.toResponseDto(course),
      enrollmentCount: course._count.enrollments,
    }));
  }

  async findOne(id: string): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        professor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return {
      ...this.toResponseDto(course),
      enrollmentCount: course._count.enrollments,
    };
  }

  async findByProfessor(professorId: string): Promise<CourseResponseDto[]> {
    const courses = await this.prisma.course.findMany({
      where: { professorId },
      include: {
        professor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => ({
      ...this.toResponseDto(course),
      enrollmentCount: course._count.enrollments,
    }));
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
  ): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Verify user is the professor of this course
    if (course.professorId !== userId) {
      throw new ForbiddenException('You are not authorized to update this course');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        professor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.toResponseDto(updatedCourse);
  }

  async remove(id: string, userId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Verify user is the professor of this course
    if (course.professorId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this course');
    }

    await this.prisma.course.delete({
      where: { id },
    });
  }

  async enrollStudents(
    courseId: string,
    enrollStudentsDto: EnrollStudentsDto,
    professorId: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Verify user is the professor of this course
    if (course.professorId !== professorId) {
      throw new ForbiddenException('You are not authorized to enroll students in this course');
    }

    // Verify all student IDs exist and are actually students
    const students = await this.prisma.user.findMany({
      where: {
        id: { in: enrollStudentsDto.studentIds },
        role: 'STUDENT',
      },
    });

    if (students.length !== enrollStudentsDto.studentIds.length) {
      throw new NotFoundException('One or more student IDs are invalid');
    }

    // Create enrollments (skip existing ones)
    const enrollments = await Promise.all(
      enrollStudentsDto.studentIds.map(async (studentId) => {
        try {
          return await this.prisma.enrollment.create({
            data: {
              studentId,
              courseId,
            },
          });
        } catch {
          // Skip if already enrolled
          return null;
        }
      }),
    );

    const successfulEnrollments = enrollments.filter((e) => e !== null);

    return {
      message: `Successfully enrolled ${successfulEnrollments.length} students`,
      enrolledCount: successfulEnrollments.length,
    };
  }

  private toResponseDto(course: any): CourseResponseDto {
    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      semester: course.semester,
      year: course.year,
      isActive: course.isActive,
      professorId: course.professorId,
      professor: course.professor,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
