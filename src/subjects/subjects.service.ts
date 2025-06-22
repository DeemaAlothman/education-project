import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async createSubject(dto: CreateSubjectDto) {
    // Validate doctor exists and role = doctor
    const doctor = await this.prisma.users.findUnique({
      where: { user_id: dto.doctor_id },
    });
    if (!doctor || doctor.role !== 'doctor') {
      throw new BadRequestException('Invalid doctor id');
    }

    return this.prisma.subjects.create({
      data: {
        name: dto.name,
        academic_year: dto.academic_year,
        department_id: dto.department_id,
        doctor_id: dto.doctor_id,
      },
    });
  }

  async updateSubject(subjectId: number, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: subjectId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    // تحقق من صحة الدكتور فقط إذا تم إرسال doctor_id (بما يشمل null)
    if (dto.doctor_id !== undefined) {
      if (dto.doctor_id === null) {
        // يسمح بإزالة الدكتور (doctor_id = null)
      } else {
        const doctor = await this.prisma.users.findUnique({
          where: { user_id: dto.doctor_id },
        });
        if (!doctor || doctor.role !== 'doctor') {
          throw new BadRequestException('Invalid doctor id');
        }
      }
    }

    return this.prisma.subjects.update({
      where: { subject_id: subjectId },
      data: {
        name: dto.name,
        academic_year: dto.academic_year,
        department_id: dto.department_id,
        doctor_id: dto.doctor_id, // ممكن يكون قيمة عدد أو null أو undefined
      },
    });
  }

  async deleteSubject(subjectId: number) {
    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: subjectId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    return this.prisma.subjects.delete({ where: { subject_id: subjectId } });
  }

  async findAll() {
    return this.prisma.subjects.findMany({
      include: {
        doctor: { select: { user_id: true, username: true, phone: true } },
        department: true,
      },
    });
  }

  //جلب مواد الطلا حسب السنة
  async getSubjectsForStudent(studentId: number) {
    const student = await this.prisma.users.findUnique({
      where: { user_id: studentId },
      select: { academic_year: true },
    });

    if (!student || student.academic_year === null) {
      throw new NotFoundException('Student academic year not found');
    }

    const subjects = await this.prisma.subjects.findMany({
      where: {
        academic_year: student.academic_year,
      },
    });

    return {
      academic_year: student.academic_year,
      subjects,
    };
  }

  async findOne(subjectId: number) {
    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: subjectId },
      include: {
        doctor: { select: { user_id: true, username: true } },
        department: true,
      },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }
  async countSubjects(): Promise<number> {
    return this.prisma.subjects.count();
  }

  async findOneWithExams(subjectId: number) {
    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: subjectId },
      include: {
        exams: true,
      },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }
}
