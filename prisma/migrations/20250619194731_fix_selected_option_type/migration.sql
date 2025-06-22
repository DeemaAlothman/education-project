/*
  Warnings:

  - You are about to drop the column `student_id` on the `Exams` table. All the data in the column will be lost.
  - Added the required column `student_id` to the `Exam_Answers` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `selected_option` on the `Exam_Answers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `doctor_id` to the `Exams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Exams" DROP CONSTRAINT "Exams_student_id_fkey";

-- AlterTable
ALTER TABLE "Exam_Answers" ADD COLUMN     "student_id" INTEGER NOT NULL,
DROP COLUMN "selected_option",
ADD COLUMN     "selected_option" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Exams" DROP COLUMN "student_id",
ADD COLUMN     "doctor_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Answers" ADD CONSTRAINT "Exam_Answers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
