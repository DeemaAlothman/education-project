import * as ExcelJS from 'exceljs';
import { BadRequestException } from '@nestjs/common';

export interface ParsedQuestion {
  question_text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: number;
}

export async function parseQuestionsExcel(
  fileBuffer: Buffer,
): Promise<ParsedQuestion[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet || worksheet.rowCount < 2) {
    throw new BadRequestException('Excel file is empty or has no valid rows');
  }

  const questions: ParsedQuestion[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const values = row.values as any[];
    if (!values || values.length < 7) return;

    const [
      _,
      question_text,
      option1,
      option2,
      option3,
      option4,
      correct_option,
    ] = values;

    if (
      !question_text ||
      !option1 ||
      !option2 ||
      !option3 ||
      !option4 ||
      isNaN(Number(correct_option)) ||
      Number(correct_option) < 1 ||
      Number(correct_option) > 4
    ) {
      return;
    }

    questions.push({
      question_text: question_text.toString().trim(),
      option1: option1.toString().trim(),
      option2: option2.toString().trim(),
      option3: option3.toString().trim(),
      option4: option4.toString().trim(),
      correct_option: Number(correct_option),
    });
  });

  return questions;
}
