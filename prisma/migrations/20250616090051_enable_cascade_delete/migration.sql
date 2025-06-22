-- DropForeignKey
ALTER TABLE "Exam_Answers" DROP CONSTRAINT "Exam_Answers_exam_id_fkey";

-- DropForeignKey
ALTER TABLE "Exam_Answers" DROP CONSTRAINT "Exam_Answers_question_id_fkey";

-- DropForeignKey
ALTER TABLE "Exams" DROP CONSTRAINT "Exams_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "Questions" DROP CONSTRAINT "Questions_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "Results" DROP CONSTRAINT "Results_exam_id_fkey";

-- DropForeignKey
ALTER TABLE "Subjects" DROP CONSTRAINT "Subjects_department_id_fkey";

-- DropForeignKey
ALTER TABLE "UserSubjects" DROP CONSTRAINT "UserSubjects_subject_id_fkey";

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("subject_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("subject_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Answers" ADD CONSTRAINT "Exam_Answers_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exams"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Answers" ADD CONSTRAINT "Exam_Answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Results" ADD CONSTRAINT "Results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exams"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubjects" ADD CONSTRAINT "UserSubjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("subject_id") ON DELETE CASCADE ON UPDATE CASCADE;
