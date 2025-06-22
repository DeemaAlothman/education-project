import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { Role } from '@prisma/client';
import { SubmitExamDto } from './dto/submit-exam.dto';
@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async createExam(userId: number, dto: CreateExamDto) {
    // Verify userId is valid
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    // Verify user is a doctor
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user || user.role !== Role.doctor) {
      throw new UnauthorizedException('Only doctors can create exams');
    }

    // Verify subject exists and is assigned to the doctor
    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: dto.subject_id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (subject.doctor_id !== userId) {
      throw new UnauthorizedException('You are not assigned to this subject');
    }

    // Create exam and questions in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Create the exam
      const exam = await prisma.exams.create({
        data: {
          subject_id: dto.subject_id,
          doctor_id: userId,
          exam_date: new Date(dto.exam_date),
          exam_type: dto.exam_type,
        },
      });

      // Create questions linked to the exam
      const questions = await prisma.questions.createMany({
        data: dto.questions.map((q) => ({
          question_text: q.question_text,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          correct_option: q.correct_option,
          subject_id: dto.subject_id,
          exam_id: exam.exam_id,
        })),
      });

      return {
        exam,
        questionsCount: questions.count,
      };
    });
  }
  async getExamsBySubject(userId: number, subjectId: number) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user || (user.role !== Role.student && user.role !== Role.doctor)) {
      throw new UnauthorizedException(
        'Only students or doctors can view exams',
      );
    }

    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (user.role === Role.doctor && subject.doctor_id !== userId) {
      throw new UnauthorizedException('You are not assigned to this subject');
    }

    return this.prisma.exams.findMany({
      where: { subject_id: subjectId },
      select: {
        exam_id: true,
        exam_date: true,
        exam_type: true,
        subject: {
          select: { name: true },
        },
        questions: {
          select: {
            question_id: true,
            question_text: true,
            option1: true,
            option2: true,
            option3: true,
            option4: true,
            correct_option: true,
            subject_id: true,
            exam_id: true,
          },
        },
      },
    });
  }

  //الاجابة على الاسئلة من قبل الطالب

  async submitExam(userId: number, examId: number, dto: SubmitExamDto) {
    // 1) التأكد من أن المستخدم طالب
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user || user.role !== Role.student) {
      throw new UnauthorizedException('Only students can submit exams');
    }

    // 2) التأكد من وجود الامتحان
    const exam = await this.prisma.exams.findUnique({
      where: { exam_id: examId },
      include: {
        questions: {
          select: {
            question_id: true,
            correct_option: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // 3) منع إعادة التقديم
    const existingResult = await this.prisma.results.findFirst({
      where: { exam_id: examId, student_id: userId },
    });

    if (existingResult) {
      throw new BadRequestException('You have already submitted this exam');
    }

    // 4) تحقق من صحة الأسئلة المقدمة
    const submittedQuestionIds = dto.answers.map((a) => a.question_id);
    const examQuestionIds = exam.questions.map((q) => q.question_id);

    const invalidQuestions = submittedQuestionIds.filter(
      (id) => !examQuestionIds.includes(id),
    );

    if (invalidQuestions.length) {
      throw new BadRequestException(
        `Invalid question IDs: ${invalidQuestions.join(', ')}`,
      );
    }

    // 5) حساب العلامة
    let score = 0;
    const correctAnswers = exam.questions.reduce(
      (acc, q) => {
        acc[q.question_id] = q.correct_option;
        return acc;
      },
      {} as Record<number, number>,
    );

    for (const answer of dto.answers) {
      const selected = Number(answer.selected_option);
      if (selected === correctAnswers[answer.question_id]) {
        score += 1;
      }
    }

    // 6) التحقق من السنة الأكاديمية (بناءً على التاريخ الحالي)
    const currentYear = new Date().getFullYear();
    const examYear = new Date(exam.exam_date).getFullYear();
    const isTraining = currentYear !== examYear;

    // 7) تخزين النتائج والإجابات
    return this.prisma.$transaction(async (prisma) => {
      await prisma.exam_Answers.createMany({
        data: dto.answers.map((a) => ({
          exam_id: examId,
          question_id: a.question_id,
          selected_option: Number(a.selected_option),
          student_id: userId,
        })),
      });

      if (isTraining) {
        return {
          exam_id: examId,
          student_id: userId,
          score,
          total_questions: exam.questions.length,
          promotion_status: 'not_saved',
          is_training: true,
          message:
            'This exam is considered as training only and was not saved in results.',
        };
      }

      const promotionStatus =
        score >= exam.questions.length / 2 || (score >= 58 && score <= 59)
          ? 'promoted'
          : 'not_promoted';

      const result = await prisma.results.create({
        data: {
          exam_id: examId,
          student_id: userId,
          score,
          promotion_status: promotionStatus,
        },
      });

      return {
        exam_id: examId,
        student_id: userId,
        score,
        total_questions: exam.questions.length,
        promotion_status: result.promotion_status,
        is_training: false,
      };
    });
  }

  async getAverageScoresBySubject() {
    const results = await this.prisma.results.groupBy({
      by: ['exam_id'],
      _avg: { score: true },
    });

    return results.map((r) => ({
      examId: r.exam_id,
      averageScore: r._avg.score,
    }));
  }

  async getPromotionRate() {
    const totalStudents = await this.prisma.results.count();
    const promotedStudents = await this.prisma.results.count({
      where: { promotion_status: 'promoted' },
    });

    const promotionRate = totalStudents
      ? (promotedStudents / totalStudents) * 100
      : 0;

    return { totalStudents, promotedStudents, promotionRate };
  }

  // تم نقل هذه الدالة من الكنترولر إلى هنا
  async getPromotionRateByDoctor(doctorId: number) {
    // جلب المواد اللي يدرسها الدكتور
    const subjects = await this.prisma.subjects.findMany({
      where: { doctor_id: doctorId },
      select: { subject_id: true },
    });
    const subjectIds = subjects.map((s) => s.subject_id);

    if (subjectIds.length === 0) {
      return { promotionRate: 0, message: 'No subjects found for this doctor' };
    }

    // جلب الطلاب المرتبطين بهذه المواد
    const userSubjects = await this.prisma.userSubjects.findMany({
      where: { subject_id: { in: subjectIds } },
      select: { user_id: true },
    });
    const studentIds = userSubjects.map((us) => us.user_id);

    if (studentIds.length === 0) {
      return { promotionRate: 0, message: 'No students found for this doctor' };
    }

    // حساب عدد النتائج المرفوعة لهؤلاء الطلاب
    const promotedCount = await this.prisma.results.count({
      where: {
        student_id: { in: studentIds },
        promotion_status: 'promoted',
      },
    });

    // عدد كل النتائج لهؤلاء الطلاب
    const totalResults = await this.prisma.results.count({
      where: {
        student_id: { in: studentIds },
      },
    });

    const promotionRate =
      totalResults > 0 ? (promotedCount / totalResults) * 100 : 0;

    return { promotionRate: +promotionRate.toFixed(2) };
  }
  //الحصول على معدل طالب حسب سنة محددة
  async getStudentAverageByYear(studentId: number, academicYear: number) {
    // جلب كل النتائج للطالب مع فحص أن الامتحان تابع لسنة المادة المطلوبة
    const results = await this.prisma.results.findMany({
      where: {
        student_id: studentId,
      },
      include: {
        exam: {
          select: {
            subject: {
              select: {
                academic_year: true,
              },
            },
          },
        },
      },
    });

    // تصفية النتائج حسب السنة الأكاديمية للمادة
    const filteredResults = results.filter(
      (r) => r.exam.subject.academic_year === academicYear,
    );

    if (filteredResults.length === 0) {
      return {
        message: 'لا توجد نتائج لهذا الطالب في السنة المحددة',
        average: 0,
      };
    }

    // حساب المعدل
    const totalScore = filteredResults.reduce((sum, r) => sum + r.score, 0);
    const average = totalScore / filteredResults.length;

    return {
      studentId,
      academicYear,
      average: +average.toFixed(2),
    };
  }

  // عرض الامتحانات للطالب التابعة لسنة معسنة مع كل الدورات هي المادة

  // exams.service.ts
  async getExamsBySubjectforstudent(subjectId: number) {
    const subject = await this.prisma.subjects.findUnique({
      where: { subject_id: subjectId },
    });

    if (!subject) throw new NotFoundException('Subject not found');

    const exams = await this.prisma.exams.findMany({
      where: { subject_id: subjectId },
      select: {
        exam_id: true,
        exam_date: true,
        exam_type: true,
      },
      orderBy: { exam_date: 'desc' },
    });

    return {
      subject: {
        subject_id: subject.subject_id,
        name: subject.name,
        academic_year: subject.academic_year,
      },
      exams,
    };
  }
  //عرض الاسئلة لهذا الامتحان
  async getQuestionsByExam(examId: number) {
    const exam = await this.prisma.exams.findUnique({
      where: { exam_id: examId },
      include: {
        questions: {
          select: {
            question_id: true,
            question_text: true,
            option1: true,
            option2: true,
            option3: true,
            option4: true,
            // correct_option: true, // عادة لا تعرض للطالب
          },
        },
        subject: {
          select: {
            subject_id: true,
            name: true,
            academic_year: true,
          },
        },
        doctor: {
          select: {
            user_id: true,
            username: true,
          },
        },
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    return {
      exam_id: exam.exam_id,
      exam_date: exam.exam_date,
      exam_type: exam.exam_type,
      subject: exam.subject,
      doctor: exam.doctor,
      questions: exam.questions,
    };
  }

  
}
