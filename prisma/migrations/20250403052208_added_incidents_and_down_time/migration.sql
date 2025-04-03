-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "incidentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "lastDownAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Incident_websiteId_startTime_idx" ON "Incident"("websiteId", "startTime");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
