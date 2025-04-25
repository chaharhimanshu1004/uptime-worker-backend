-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "isEmailSent" BOOLEAN DEFAULT false,
ADD COLUMN     "lastEmailSentAt" TIMESTAMP(3);
