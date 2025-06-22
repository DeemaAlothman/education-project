import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ParseIntPipe, Req } from '@nestjs/common';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Roles('admin')
  @Get()
  async getAllDepartments() {
    return this.departmentsService.findAll();
  }

  @Post()
  @Roles('admin')
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDepartmentDto,
  ) {
    console.log('DepartmentsController - req.user:', req.user);
    return this.departmentsService.create(dto);
  }

  @Get('count')
  async getDepartmentsCount() {
    return { count: await this.departmentsService.countDepartments() };
  }

  @Roles('admin')
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.delete(id);
  }

  @Roles('doctor')
  @Get(':id/subjects')
  async getDepartmentWithSubjects(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOneWithSubjects(id);
  }
}
