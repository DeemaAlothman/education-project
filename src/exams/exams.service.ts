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

    // Check if an exam already exists for the same subject and date
    const existingExam = await this.prisma.exams.findFirst({
      where: {
        subject_id: dto.subject_id,
        exam_date: new Date(dto.exam_date),
      },
    });

    if (existingExam) {
      throw new BadRequestException(
        'An exam already exists for this subject on the same date',
      );
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
    console.log('Received data:', { userId, examId, dto }); // للفحص
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

    // 6) حساب حالة الترقية
    const promotionStatus =
      score >= exam.questions.length / 2 || (score >= 58 && score <= 59)
        ? 'promoted'
        : 'not_promoted';

    // 7) تخزين النتائج والإجابات
    const result = await this.prisma.$transaction(async (prisma) => {
      const answersData = dto.answers.map((a) => ({
        exam_id: examId,
        question_id: a.question_id,
        selected_option: Number(a.selected_option),
        student_id: userId,
      }));
      console.log('Answers data to create:', answersData);
      await prisma.exam_Answers.createMany({
        data: answersData,
      });

      const createdResult = await prisma.results.create({
        data: {
          exam_id: examId,
          student_id: userId,
          score,
          promotion_status: promotionStatus,
        },
      });
      console.log('Created result:', createdResult);

      return createdResult;
    });

    return {
      exam_id: examId,
      student_id: userId,
      score,
      total_questions: exam.questions.length,
      promotion_status: result.promotion_status,
      is_training: false,
    };
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
  async getAllDoctorsPromotion() {
    // تعريف نوع العنصر داخل مصفوفة doctorPromotions
    const doctorPromotions: {
      doctorId: number;
      doctorName: string;
      subjects: string[];
      promotionRate: number;
      message?: string;
    }[] = [];

    const doctors = await this.prisma.users.findMany({
      where: { role: 'doctor' },
      select: {
        user_id: true,
        username: true, // عدّلها حسب اسم الحقل اللي بيمثل اسم الدكتور
      },
    });

    for (const doctor of doctors) {
      const subjects = await this.prisma.subjects.findMany({
        where: { doctor_id: doctor.user_id },
        select: {
          subject_id: true,
          name: true,
        },
      });

      const subjectNames = subjects.map((s) => s.name);
      const subjectIds = subjects.map((s) => s.subject_id);

      if (subjectIds.length === 0) {
        doctorPromotions.push({
          doctorId: doctor.user_id,
          doctorName: doctor.username,
          subjects: [],
          promotionRate: 0,
          message: 'No subjects found for this doctor',
        });
        continue;
      }

      const exams = await this.prisma.exams.findMany({
        where: {
          doctor_id: doctor.user_id,
          subject_id: { in: subjectIds },
        },
        select: { exam_id: true },
      });

      const examIds = exams.map((e) => e.exam_id);

      if (examIds.length === 0) {
        doctorPromotions.push({
          doctorId: doctor.user_id,
          doctorName: doctor.username,
          subjects: subjectNames,
          promotionRate: 0,
          message: 'No exams found for this doctor',
        });
        continue;
      }

      const results = await this.prisma.results.findMany({
        where: {
          exam_id: { in: examIds },
        },
        select: { promotion_status: true },
      });

      if (results.length === 0) {
        doctorPromotions.push({
          doctorId: doctor.user_id,
          doctorName: doctor.username,
          subjects: subjectNames,
          promotionRate: 0,
          message: 'No results found for this doctor',
        });
        continue;
      }

      const promotedCount = results.filter(
        (r) => r.promotion_status === 'promoted',
      ).length;

      const promotionRate = (promotedCount / results.length) * 100;

      doctorPromotions.push({
        doctorId: doctor.user_id,
        doctorName: doctor.username,
        subjects: subjectNames,
        promotionRate: +promotionRate.toFixed(2),
      });
    }

    const totalPromotionRate =
      doctorPromotions.reduce(
        (sum, curr) => sum + (curr.promotionRate || 0),
        0,
      ) / (doctorPromotions.length || 1);

    return {
      doctorPromotions,
      overallPromotionRate: +totalPromotionRate.toFixed(2),
    };
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

  async getStudentsSubjectsAndScores() {
    // جلب جميع الطلاب (Users مع role = student)
    const students = await this.prisma.users.findMany({
      where: { role: 'student' },
      select: { user_id: true, username: true },
    });

    const studentData = await Promise.all(
      students.map(async (student) => {
        // جلب النتائج (العلامات) لكل طالب مع ربطها بالمواد
        const results = await this.prisma.results.findMany({
          where: { student_id: student.user_id },
          include: {
            exam: {
              include: { subject: true }, // ربط المادة
            },
          },
        });
        console.log(`Results for student ${student.user_id}:`, results);

        // التحقق من البيانات للتأكد من العلاقات وإضافة تفاصيل
        const subjectsWithScores = results.map((result) => {
          const exam = result.exam;
          const subject = exam ? exam.subject : null;
          return {
            subjectName: subject
              ? subject.name || 'Unknown Subject'
              : 'No Subject',
            score: result.score,
            promotionStatus: result.promotion_status || 'not_taken',
            examId: result.exam_id,
            subjectId: exam ? exam.subject_id : null,
            examExists: !!exam,
            subjectExists: !!subject,
            resultData: {
              student_id: result.student_id,
              exam_id: result.exam_id,
            },
          };
        });

        // حساب المعدل إذا فيه نتائج
        const average =
          subjectsWithScores.length > 0
            ? +(
                subjectsWithScores.reduce((sum, s) => sum + (s.score || 0), 0) /
                subjectsWithScores.length
              ).toFixed(2)
            : 0;

        return {
          studentId: student.user_id,
          username: student.username,
          subjects: subjectsWithScores,
          hasResults: results.length > 0,
          average: average, // إضافة المعدل
        };
      }),
    );

    return { students: studentData };
  }

  //ترتيب المعدل للطلاب حسب الاعلى لكل قسم
  async getStudentsRankingByDepartment(userId: number) {
    // 1) التأكد من أن المستخدم أدمن
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user || (user.role !== Role.superadmin && user.role !== Role.admin)) {
      throw new UnauthorizedException('Only admins can view student rankings');
    }

    // 2) جلب الطلاب مع نتائجهم وأقسامهم
    const students = await this.prisma.users.findMany({
      where: { role: Role.student },
      include: {
        department: true,
        results: {
          include: {
            exam: {
              include: { subject: true },
            },
          },
        },
      },
    });

    // 3) حساب المعدل وحصر الترتيب حسب القسم
    const rankingsByDepartment = {};
    students.forEach((student) => {
      const totalScore = student.results.reduce(
        (sum, result) => sum + result.score,
        0,
      );
      const average =
        student.results.length > 0
          ? +(totalScore / student.results.length).toFixed(2)
          : 0;

      const departmentId = student.department?.department_id || 'No Department';
      if (!rankingsByDepartment[departmentId]) {
        rankingsByDepartment[departmentId] = {
          departmentName: student.department?.name || 'No Department',
          students: [],
        };
      }

      rankingsByDepartment[departmentId].students.push({
        studentId: student.user_id,
        username: student.username,
        average: average,
        resultsCount: student.results.length,
      });
    });

    // 4) ترتيب الطلاب حسب المعدل تنازليًا لكل قسم
    for (const departmentId in rankingsByDepartment) {
      rankingsByDepartment[departmentId].students.sort(
        (a, b) => b.average - a.average,
      );
    }

    // 5) تحويل إلى مصفوفة للعودة
    return {
      rankings: Object.values(rankingsByDepartment),
    };
  }
}
