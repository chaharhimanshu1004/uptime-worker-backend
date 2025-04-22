/*
  Warnings:

  - Added the required column `region` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `WebsiteStatus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "region" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WebsiteStatus" ADD COLUMN     "region" TEXT NOT NULL;
