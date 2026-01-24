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
import { RubricsService } from './rubrics.service';
import { CreateRubricWithCriteriaDto, UpdateRubricDto, RubricResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@autograder/database';

@Controller('rubrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RubricsController {
  constructor(private readonly rubricsService: RubricsService) {}

  @Post()
  @Roles(UserRole.PROFESSOR)
  async create(@Body() createRubricDto: CreateRubricWithCriteriaDto): Promise<RubricResponseDto> {
    return this.rubricsService.create(createRubricDto);
  }

  @Post('upload')
  @Roles(UserRole.PROFESSOR)
  @UseInterceptors(FileInterceptor('file'))
  async uploadJson(@UploadedFile() file: Express.Multer.File): Promise<RubricResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file is JSON
    if (!file.originalname.match(/\.json$/i)) {
      throw new BadRequestException('File must be a JSON file');
    }

    // Convert buffer to string
    const jsonContent = file.buffer.toString('utf-8');

    return this.rubricsService.uploadFromJson(jsonContent);
  }

  @Get()
  async findAll(): Promise<RubricResponseDto[]> {
    return this.rubricsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RubricResponseDto> {
    return this.rubricsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PROFESSOR)
  async update(
    @Param('id') id: string,
    @Body() updateRubricDto: UpdateRubricDto,
  ): Promise<RubricResponseDto> {
    return this.rubricsService.update(id, updateRubricDto);
  }

  @Delete(':id')
  @Roles(UserRole.PROFESSOR)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.rubricsService.remove(id);
  }
}
