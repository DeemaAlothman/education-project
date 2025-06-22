import { IsInt, Min, IsArray, IsNotEmpty,Max } from 'class-validator';

class AnswerDto {
  @IsInt()
  @Min(1)
  question_id: number;

  @IsInt()
  @Min(1)
  @Max(4)
  selected_option: number;
}

export class SubmitExamDto {
  @IsArray()
  @IsNotEmpty()
  answers: AnswerDto[];
}
