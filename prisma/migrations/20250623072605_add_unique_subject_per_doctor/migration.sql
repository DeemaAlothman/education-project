/*
  Warnings:

  - A unique constraint covering the columns `[name,doctor_id]` on the table `Subjects` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Subjects_name_doctor_id_key" ON "Subjects"("name", "doctor_id");
