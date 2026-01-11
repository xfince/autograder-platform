import { IsString, IsInt, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  semester?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
