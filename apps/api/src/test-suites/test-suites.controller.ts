import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TestSuitesService } from './test-suites.service';
import {
  CreateTestSuiteDto,
  UpdateTestSuiteDto,
  CreateTestFileDto,
  UpdateTestFileDto,
  TestSuiteResponseDto,
  TestFileResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@autograder/database';

@Controller('test-suites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestSuitesController {
  constructor(private readonly testSuitesService: TestSuitesService) {}

  @Post()
  @Roles(UserRole.PROFESSOR)
  async create(
    @CurrentUser() user: any,
    @Body() createTestSuiteDto: CreateTestSuiteDto,
  ): Promise<TestSuiteResponseDto> {
    return this.testSuitesService.create(user.id, createTestSuiteDto);
  }

  @Get()
  async findAll(): Promise<TestSuiteResponseDto[]> {
    return this.testSuitesService.findAll();
  }

  @Get('assignment/:assignmentId')
  async findByAssignment(
    @Param('assignmentId') assignmentId: string,
  ): Promise<TestSuiteResponseDto[]> {
    return this.testSuitesService.findByAssignment(assignmentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TestSuiteResponseDto> {
    return this.testSuitesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PROFESSOR)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateTestSuiteDto: UpdateTestSuiteDto,
  ): Promise<TestSuiteResponseDto> {
    return this.testSuitesService.update(id, user.id, updateTestSuiteDto);
  }

  @Delete(':id')
  @Roles(UserRole.PROFESSOR)
  async remove(@CurrentUser() user: any, @Param('id') id: string): Promise<{ message: string }> {
    return this.testSuitesService.remove(id, user.id);
  }

  // Test File Operations

  @Post(':id/files')
  @Roles(UserRole.PROFESSOR)
  @UseInterceptors(FileInterceptor('file'))
  async addTestFile(
    @CurrentUser() user: any,
    @Param('id') testSuiteId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body?: any,
  ): Promise<TestFileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file is a test file (.js, .ts, .jsx, .tsx)
    if (!file.originalname.match(/\.(js|ts|jsx|tsx)$/i)) {
      throw new BadRequestException('File must be a JavaScript or TypeScript test file');
    }

    // Extract content from file
    const content = file.buffer.toString('utf-8');

    const dto: CreateTestFileDto = {
      fileName: file.originalname,
      filePath: `tests/${file.originalname}`,
      content,
      testSuiteId,
      criterionId: body?.criterionId,
      isGenerated: false,
    };

    return this.testSuitesService.addTestFile(user.id, dto);
  }

  @Patch(':id/files/:fileId')
  @Roles(UserRole.PROFESSOR)
  async updateTestFile(
    @CurrentUser() user: any,
    @Param('fileId') fileId: string,
    @Body() updateTestFileDto: UpdateTestFileDto,
  ): Promise<TestFileResponseDto> {
    return this.testSuitesService.updateTestFile(fileId, user.id, updateTestFileDto);
  }

  @Delete(':id/files/:fileId')
  @Roles(UserRole.PROFESSOR)
  async removeTestFile(
    @CurrentUser() user: any,
    @Param('fileId') fileId: string,
  ): Promise<{ message: string }> {
    return this.testSuitesService.removeTestFile(fileId, user.id);
  }
}
