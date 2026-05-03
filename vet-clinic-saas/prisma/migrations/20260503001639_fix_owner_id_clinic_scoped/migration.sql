/*
  Warnings:

  - A unique constraint covering the columns `[idNumber,clinicId]` on the table `owners` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "owners_idNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "owners_idNumber_clinicId_key" ON "owners"("idNumber", "clinicId");
