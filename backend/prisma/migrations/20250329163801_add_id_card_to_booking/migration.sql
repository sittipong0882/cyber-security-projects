/*
  Warnings:

  - Made the column `idCard` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "idCard" SET NOT NULL;
