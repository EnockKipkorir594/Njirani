/*
  Warnings:

  - Made the column `scheduledAt` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "scheduledAt" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
