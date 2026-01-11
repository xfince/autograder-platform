import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, EnrollStudentsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@autograder/database';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.PROFESSOR)
  create(@Body() createCourseDto: CreateCourseDto, @CurrentUser() user: any) {
    return this.coursesService.create(createCourseDto, user.id);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('my-courses')
  @Roles(UserRole.PROFESSOR)
  findMyCourses(@CurrentUser() user: any) {
    return this.coursesService.findByProfessor(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PROFESSOR)
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.update(id, updateCourseDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.PROFESSOR)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.remove(id, user.id);
  }

  @Post(':id/enrollments')
  @Roles(UserRole.PROFESSOR)
  enrollStudents(
    @Param('id') id: string,
    @Body() enrollStudentsDto: EnrollStudentsDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.enrollStudents(id, enrollStudentsDto, user.id);
  }
}
