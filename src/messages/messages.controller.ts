import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { UserRole } from '../users/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post('send')
  @Roles(UserRole.STUDENT, UserRole.DOCTOR)
  sendMessage(
    @Body('student_id') studentId: number,
    @Body('doctor_id') doctorId: number,
    @Body('message_text') messageText: string,
  ) {
    return this.messagesService.sendMessage(studentId, doctorId, messageText);
  }

  @Get('inbox')
  @Roles('doctor')
  getDoctorInbox(@Request() req) {
    const doctorId = req.user.id;
    return this.messagesService.getAllMessagesSentToDoctor(doctorId);
  }

  @Get('student/messages')
  @Roles('student')
  getStudentMessages(@Request() req) {
    const studentId = req.user.id;
    return this.messagesService.getAllMessagesSentByStudent(studentId);
  }
}
