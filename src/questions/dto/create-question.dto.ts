import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateQuestionDto {
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

  @IsInt()
  @Min(1)
  subject_id: number;

  @IsInt()
  @Min(1)
  exam_id: number; // حقل جديد لمعرف الامتحان
}
