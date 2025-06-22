import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
  ParseIntPipe,
  Req,
  Query,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { SubjectsService } from '../subjects/subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateExamDto } from './dto/create-exam.dto';

import { SubmitExamDto } from './dto/submit-exam.dto';
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}
import { Request } from 'express';
@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
    private readonly subjectsService: SubjectsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateExamDto) {
    return this.examsService.createExam(req.user.id, dto);
  }

  @Get('subject/:subject_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student', 'doctor')
  async getExamsBySubject(
    @Req() req: AuthenticatedRequest,
    @Param('subject_id', ParseIntPipe) subjectId: number,
  ) {
    return this.examsService.getExamsBySubject(req.user.id, subjectId);
  }
  //حل الاجابات من قبل الطالب لامتحان معين مع الترفع الاداري اذا تطلب
  @Post(':exam_id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  async submitExam(
    @Req() req: AuthenticatedRequest,
    @Param('exam_id', ParseIntPipe) examId: number,
    @Body() dto: SubmitExamDto,
  ) {
    return this.examsService.submitExam(req.user.id, examId, dto);
  }

  @Roles('admin')
  @Get('reports/average-scores')
  async getAverageScores() {
    return this.examsService.getAverageScoresBySubject();
  }

  @Roles('admin')
  @Get('reports/promotion-rate')
  async getPromotionStats() {
    return this.examsService.getPromotionRate();
  }

  @Roles('admin')
  @Get('reports/promotion-rate/doctor/:id')
  async getDoctorPromotion(@Param('id', ParseIntPipe) id: number) {
    return this.examsService.getPromotionRateByDoctor(id);
  }
  @Get('average/:studentId/:year')
  async getStudentYearAverage(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('year', ParseIntPipe) academicYear: number,
  ) {
    return this.examsService.getStudentAverageByYear(studentId, academicYear);
  }

  // 1) جلب كل الامتحانات لمادة معينة
  @Get('subjects/:subjectId/exams')
  async getExamsBySubjectforstudent(
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.examsService.getExamsBySubjectforstudent(subjectId);
  }

  // 2) جلب كل الأسئلة التابعة لامتحان معين
  @Get('/:examId/questions')
  async getQuestionsByExam(@Param('examId', ParseIntPipe) examId: number) {
    return this.examsService.getQuestionsByExam(examId);
  }



}
