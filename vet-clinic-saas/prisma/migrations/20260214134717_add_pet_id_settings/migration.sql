-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "petIdFormat" TEXT DEFAULT 'PET####',
ADD COLUMN     "petIdMode" TEXT DEFAULT 'MANUAL';
