-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_websiteId_fkey";

-- DropForeignKey
ALTER TABLE "WebsiteStatus" DROP CONSTRAINT "WebsiteStatus_websiteId_fkey";

-- AddForeignKey
ALTER TABLE "WebsiteStatus" ADD CONSTRAINT "WebsiteStatus_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
