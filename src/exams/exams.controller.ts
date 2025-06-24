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
import { Request } from 'express';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: Role; // استخدام Role من Prisma
  };
}

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
  @Get('promotion-rate/doctor')
  async getAllDoctorsPromotion() {
    return this.examsService.getAllDoctorsPromotion();
  }

  @Get('average/:studentId/:year')
  async getStudentYearAverage(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('year', ParseIntPipe) academicYear: number,
  ) {
    return this.examsService.getStudentAverageByYear(studentId, academicYear);
  }

  @Get('subjects/:subjectId/exams')
  async getExamsBySubjectforstudent(
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.examsService.getExamsBySubjectforstudent(subjectId);
  }

  @Get('/:examId/questions')
  async getQuestionsByExam(@Param('examId', ParseIntPipe) examId: number) {
    return this.examsService.getQuestionsByExam(examId);
  }

  @Roles('admin')
  @Get('students-subjects-scores')
  async getStudentsSubjectsAndScores() {
    return this.examsService.getStudentsSubjectsAndScores();
  }

  @Get('rankings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  async getStudentsRankingByDepartment(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id; // استخدام id من AuthenticatedRequest
    const rankings =
      await this.examsService.getStudentsRankingByDepartment(userId);
    return rankings;
  }
}
