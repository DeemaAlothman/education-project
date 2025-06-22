import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsInt()
  department_id: number;

  @IsInt()
  @Min(1)
  @Max(5)
  academic_year: number;

  @IsInt()
  doctor_id: number;
}
