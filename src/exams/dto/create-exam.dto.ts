import {
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  Max
} from 'class-validator';

class QuestionDto {
  @IsNotEmpty()
  @IsString()
  question_text: string;

  @IsNotEmpty()
  @IsString()
  option1: string;

  @IsNotEmpty()
  @IsString()
  option2: string;

  @IsNotEmpty()
  @IsString()
  option3: string;

  @IsNotEmpty()
  @IsString()
  option4: string;

  @IsInt()
  @Min(1)
  @Max(4)
  correct_option: number;
}

export class CreateExamDto {
  @IsInt()
  @Min(1)
  subject_id: number;

  @IsDateString()
  exam_date: string;

  @IsEnum(['theoretical', 'practical'])
  exam_type: string;

  @IsArray()
  @IsNotEmpty()
  questions: QuestionDto[];
}
