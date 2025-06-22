import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // assuming prisma service path
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';

@Module({
  controllers: [SubjectsController],
  providers: [SubjectsService, PrismaService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
