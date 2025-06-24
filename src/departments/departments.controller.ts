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


@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}


  @Get('with-subjects')
  async getAllDepartmentsWithDetails() {
    return this.departmentsService.getAllDepartmentsWithDetails();
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllDepartments() {
    return this.departmentsService.findAll();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('admin')
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDepartmentDto,
  ) {
    console.log('DepartmentsController - req.user:', req.user);
    return this.departmentsService.create(dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('count')
  async getDepartmentsCount() {
    return { count: await this.departmentsService.countDepartments() };
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.delete(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @Get(':id/subjects')
  async getDepartmentWithSubjects(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOneWithSubjects(id);
  }


}
