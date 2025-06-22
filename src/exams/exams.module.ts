import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionsModule } from '../questions/questions.module'; 
import { SubjectsModule } from '../subjects/subjects.module';
@Module({
  imports: [QuestionsModule, SubjectsModule],
  controllers: [ExamsController],
  providers: [ExamsService, PrismaService],

})
export class ExamsModule {}
