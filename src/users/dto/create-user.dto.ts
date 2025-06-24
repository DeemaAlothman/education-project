import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  academic_year?: number;

  @IsOptional()
  phone?: string;

  @IsOptional()
  department_id?: number;
}
