import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  ParseIntPipe,
  Request,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}
@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.createSubject(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update subjects');
    }
    return this.subjectsService.updateSubject(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete subjects');
    }
    return this.subjectsService.deleteSubject(id);
  }
  @Get('count')
  async getSubjectsCount() {
    return { count: await this.subjectsService.countSubjects() };
  }

  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('student')
  async getSubjectsForStudent(@Req() req: AuthenticatedRequest) {
    return this.subjectsService.getSubjectsForStudent(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  @Roles('doctor')
  @Get(':id/exams')
  async getSubjectWithExams(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOneWithExams(id);
  }
}
