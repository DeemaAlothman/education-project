import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../users/enums/user-role.enum';
@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(studentId: number, doctorId: number, messageText: string) {
    return this.prisma.messages.create({
      data: {
        student_id: studentId,
        doctor_id: doctorId,
        message_text: messageText,
      },
    });
  }

  async getMessagesForUser(userId: number, role: UserRole) {
    if (role === UserRole.STUDENT) {
      return this.prisma.messages.findMany({
        where: { student_id: userId },
        include: { doctor: true },
        orderBy: { sent_at: 'desc' },
      });
    } else if (role === UserRole.DOCTOR) {
      return this.prisma.messages.findMany({
        where: { doctor_id: userId },
        include: { student: true },
        orderBy: { sent_at: 'desc' },
      });
    } else {
      throw new Error('Only students and doctors can have messages');
    }
  }
}
