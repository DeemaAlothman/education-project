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

  // subjects.service.ts
  async createSubject(dto: CreateSubjectDto) {
    const doctor = await this.prisma.users.findUnique({
      where: { user_id: dto.doctor_id },
    });

    if (!doctor || doctor.role !== 'doctor') {
      throw new BadRequestException('Invalid doctor id');
    }

    const existingSubject = await this.prisma.subjects.findFirst({
      where: {
        name: dto.name,
        doctor_id: dto.doctor_id,
      },
    });

    if (existingSubject) {
      throw new BadRequestException('هذه المادة مضافة مسبقًا لهذا الدكتور');
    }

    const newSubject = await this.prisma.subjects.create({
      data: {
        name: dto.name,
        academic_year: dto.academic_year,
        department_id: dto.department_id,
        doctor_id: dto.doctor_id,
      },
    });

    console.log('✅ تمت الإضافة في قاعدة البيانات:', newSubject);

    return newSubject;
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
  // src/subjects/subjects.service.ts

  // src/subjects/subjects.service.ts

  async getSubjectsForStudent(studentId: number) {
    const student = await this.prisma.users.findUnique({
      where: { user_id: studentId },
      select: { academic_year: true, department_id: true },
    });

    if (
      !student || // تحقق من وجود الطالب
      student.academic_year === null || // تحقق أن السنة غير null
      student.department_id === null // تحقق أن القسم غير null
    ) {
      throw new NotFoundException(
        'لم يتم العثور على معلومات الطالب (السنة أو القسم)',
      );
    }

    const subjects = await this.prisma.subjects.findMany({
      where: {
        academic_year: student.academic_year as number,
        department_id: student.department_id as number,
      },
    });

    return {
      academic_year: student.academic_year,
      department_id: student.department_id,
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
