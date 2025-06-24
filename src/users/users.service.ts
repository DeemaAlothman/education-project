import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.users.findUnique({ where: { username } });
    return user ? new User(user) : null;
  }

  async findOne(id: number) {
    const user = await this.prisma.users.findUnique({ where: { user_id: id } });
    return user ? new User(user) : null;
  }

 
  async create(createUserDto: {
    username: string;
    password: string;
    role: UserRole;
    academic_year?: number;
    phone?: string;
    department_id?: number; // ← أضف هذا السطر
  }) {
    return this.prisma.users.create({ data: createUserDto });
  }

  async update(id: number, data: any) {
    return this.prisma.users.update({
      where: { user_id: id },
      data,
    });
  }

  async findAllDoctors() {
    return this.prisma.users.findMany({
      where: { role: 'doctor' },
    });
  }

  async updateDoctor(id: number, updateDto: Partial<CreateUserDto>) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: id },
    });

    if (!user || user.role !== 'doctor') {
      throw new NotFoundException('Doctor not found');
    }

    return this.prisma.users.update({
      where: { user_id: id },
      data: {
        username: updateDto.username,
        phone: updateDto.phone,
        academic_year: updateDto.academic_year,
      },
    });
  }

  async deleteDoctor(id: number) {
    const user = await this.prisma.users.findUnique({ where: { user_id: id } });

    if (!user || user.role !== 'doctor') {
      throw new NotFoundException('Doctor not found');
    }

    return this.prisma.users.delete({
      where: { user_id: id },
    });
  }

  async countDoctors(): Promise<number> {
    return this.prisma.users.count({
      where: { role: 'doctor' },
    });
  }

  async getSubjectsByDoctorId(doctorId: number) {
    const doctor = await this.prisma.users.findUnique({
      where: { user_id: doctorId },
      include: {
        teachingSubjects: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!doctor || doctor.role !== 'doctor') {
      throw new NotFoundException('Doctor not found or not a doctor');
    }

    return doctor.teachingSubjects;
  }
}
