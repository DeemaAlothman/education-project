// src/app.module.ts (تأكد من أن ConfigModule مضاف بشكل global)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
// باقي الـ imports
import { SubjectsModule } from './subjects/subjects.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';

import { MessagesModule } from './messages/messages.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // مهم جداً - يجعل ConfigService متاح في كل مكان
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    SubjectsModule,
    DepartmentsModule,
    QuestionsModule,
    ExamsModule,
    MessagesModule,
    // باقي الـ modules
  ],
})
export class AppModule {}
