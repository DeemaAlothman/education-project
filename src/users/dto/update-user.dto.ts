import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsPhoneNumber,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  academic_year?: number;

  @IsOptional()
  @IsInt()
  department_id?: number;
}
