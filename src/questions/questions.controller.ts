import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    if (!req.user || !req.user.id || isNaN(req.user.id)) {
      throw new BadRequestException('Invalid or missing user ID');
    }
    return this.questionsService.createQuestion(req.user.id, createQuestionDto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @UseInterceptors(FileInterceptor('file'))
  async uploadQuestions(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() examDto: CreateExamDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.questionsService.importFromExcel(
      req.user.id,
      examDto,
      file.buffer,
    );
  }
}
