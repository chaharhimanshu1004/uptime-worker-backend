/*
  Warnings:

  - You are about to drop the column `isEmailSent` on the `Website` table. All the data in the column will be lost.
  - You are about to drop the column `lastEmailSentAt` on the `Website` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Website" DROP COLUMN "isEmailSent",
DROP COLUMN "lastEmailSentAt";
