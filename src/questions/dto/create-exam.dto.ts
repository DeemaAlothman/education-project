import {
  IsInt,
  Min,
  IsString,
  IsNotEmpty,
  IsIn,
  
} from 'class-validator';
import { Transform } from 'class-transformer';
export class CreateExamDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  subject_id: number;

  @IsString()
  @IsNotEmpty()
  exam_date: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['theoretical', 'practical'])
  exam_type: string;
}
