/*
  Warnings:

  - The `role` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('superadmin', 'admin', 'doctor', 'student');

-- AlterTable
ALTER TABLE "Questions" ADD COLUMN     "exam_id" INTEGER;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'admin';

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exams"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;
