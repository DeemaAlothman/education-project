-- AlterTable
ALTER TABLE "Subjects" ADD COLUMN     "doctor_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
