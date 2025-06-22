import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Delete,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users/doctors')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('admin')
  @Get()
  async getAllDoctors() {
    return this.usersService.findAllDoctors();
  }

  @Roles('admin')
  @Patch(':id')
  async updateDoctor(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.updateDoctor(id, updateDto);
  }

  @Roles('admin')
  @Delete(':id')
  async deleteDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteDoctor(id);
  }

  @Roles('admin')
  @Get('count')
  async getDoctorsCount() {
    return { count: await this.usersService.countDoctors() };
  }

  @Roles('admin', 'doctor')
  @Get(':id/subjects')
  async getSubjects(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getSubjectsByDoctorId(id);
  }
}
