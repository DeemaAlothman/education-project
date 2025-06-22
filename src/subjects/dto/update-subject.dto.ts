import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  academic_year?: number;

  @IsOptional()
  @IsInt()
  doctor_id?: number;
}
