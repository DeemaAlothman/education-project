/*
  Warnings:

  - You are about to drop the column `department_id` on the `Users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_department_id_fkey";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "department_id";
