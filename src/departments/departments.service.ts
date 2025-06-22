import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    if (!dto.name || typeof dto.name !== 'string') {
      throw new BadRequestException('Invalid department name');
    }

    return this.prisma.departments.create({
      data: {
        name: dto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.departments.findMany();
  }

  async findOne(id: number) {
    console.log('findOne id:', id);
    const department = await this.prisma.departments.findUnique({
      where: { department_id: id },
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    await this.findOne(id); // تحقق من وجود القسم أولاً
    return this.prisma.departments.update({
      where: { department_id: id },
      data: dto,
    });
  }

  async delete(id: number) {
    const department = await this.prisma.departments.findUnique({
      where: { department_id: id },
    });
    if (!department) {
      throw new NotFoundException(`القسم بالمعرف ${id} غير موجود`);
    }
    return this.prisma.departments.delete({
      where: { department_id: id },
    });
  }

  async countDepartments(): Promise<number> {
    return this.prisma.departments.count();
  }

  async findOneWithSubjects(id: number) {
    const department = await this.prisma.departments.findUnique({
      where: { department_id: id },
      include: {
        subjects: true, // جلب المواد المرتبطة بالقسم
      },
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }
}
