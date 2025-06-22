import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { parseQuestionsExcel, ParsedQuestion } from './excel/excel-parser';
import { Role } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async createQuestion(userId: number, createQuestionDto: CreateQuestionDto) {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user || user.role !== Role.doctor) {
      throw new UnauthorizedException('Only doctors can add questions');
    }

    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: createQuestionDto.subject_id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (subject.doctor_id !== userId) {
      throw new UnauthorizedException('You are not assigned to this subject');
    }

    const exam = await this.prisma.exams.findUnique({
      where: { exam_id: createQuestionDto.exam_id },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.subject_id !== createQuestionDto.subject_id) {
      throw new BadRequestException(
        'Exam does not belong to the specified subject',
      );
    }

    return this.prisma.questions.create({
      data: {
        question_text: createQuestionDto.question_text,
        option1: createQuestionDto.option1,
        option2: createQuestionDto.option2,
        option3: createQuestionDto.option3,
        option4: createQuestionDto.option4,
        correct_option: createQuestionDto.correct_option,
        subject_id: createQuestionDto.subject_id,
        exam_id: createQuestionDto.exam_id,
      },
    });
  }

  async importFromExcel(
    userId: number,
    examInput: CreateExamDto,
    fileBuffer: Buffer,
  ) {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user || user.role !== Role.doctor) {
      throw new UnauthorizedException('Only doctors can create exams');
    }

    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: examInput.subject_id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (subject.doctor_id !== userId) {
      throw new UnauthorizedException('You are not assigned to this subject');
    }

    const parsedQuestions = await parseQuestionsExcel(fileBuffer);

    if (parsedQuestions.length === 0) {
      throw new BadRequestException('No valid questions found in the file');
    }

    return this.prisma.$transaction(async (prisma) => {
      const exam = await prisma.exams.create({
        data: {
          subject_id: examInput.subject_id,
          doctor_id: userId,
          exam_date: new Date(examInput.exam_date),
          exam_type: examInput.exam_type,
        },
      });

      const questions = await prisma.questions.createMany({
        data: parsedQuestions.map((q) => ({
          question_text: q.question_text,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          correct_option: q.correct_option,
          subject_id: examInput.subject_id,
          exam_id: exam.exam_id,
        })),
      });

      return {
        exam: {
          exam_id: exam.exam_id,
          subject_id: exam.subject_id,
          doctor_id: exam.doctor_id,
          exam_date: exam.exam_date.toISOString(),
          exam_type: exam.exam_type,
        },
        questionsCount: questions.count,
      };
    });
  }
}
