import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto, AssignmentResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@autograder/database';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.PROFESSOR)
  async create(
    @CurrentUser() user: any,
    @Body() createAssignmentDto: CreateAssignmentDto,
  ): Promise<AssignmentResponseDto> {
    return this.assignmentsService.create(user.id, createAssignmentDto);
  }

  @Get()
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async findAll(): Promise<AssignmentResponseDto[]> {
    return this.assignmentsService.findAll();
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string): Promise<AssignmentResponseDto[]> {
    return this.assignmentsService.findByCourse(courseId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AssignmentResponseDto> {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PROFESSOR)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<AssignmentResponseDto> {
    return this.assignmentsService.update(id, user.id, updateAssignmentDto);
  }

  @Post(':id/publish')
  @Roles(UserRole.PROFESSOR)
  async publish(@CurrentUser() user: any, @Param('id') id: string): Promise<AssignmentResponseDto> {
    return this.assignmentsService.publish(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.PROFESSOR)
  async remove(@CurrentUser() user: any, @Param('id') id: string): Promise<{ message: string }> {
    return this.assignmentsService.remove(id, user.id);
  }
}
