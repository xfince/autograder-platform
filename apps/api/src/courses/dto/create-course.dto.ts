import { IsString, IsInt, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(2)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  semester: string; // e.g., "Fall 2025"

  @IsInt()
  year: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
