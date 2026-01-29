/*
  Warnings:

  - The values [PENDING,IN_PROGRESS] on the enum `letter_status` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[resource,action]` on the table `permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `letter_instance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "letter_status_new" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."letter_instance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "letter_instance" ALTER COLUMN "status" TYPE "letter_status_new" USING ("status"::text::"letter_status_new");
ALTER TYPE "letter_status" RENAME TO "letter_status_old";
ALTER TYPE "letter_status_new" RENAME TO "letter_status";
DROP TYPE "public"."letter_status_old";
ALTER TABLE "letter_instance" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "attachment" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "letterId" TEXT,
ADD COLUMN     "uploadedByUserId" TEXT;

-- AlterTable
ALTER TABLE "letter_instance" ADD COLUMN     "assignedApprovers" JSONB,
ADD COLUMN     "documentVersions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "latestEditableVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "latestPDFVersion" INTEGER,
ADD COLUMN     "signatureUrl" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "letter_step_history" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "step" INTEGER,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "comment" TEXT,
    "fromStep" INTEGER,
    "toStep" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_step_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_numbering" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "letterTypeCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "counter" INTEGER NOT NULL,
    "numberString" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_numbering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "letter_step_history_letterId_idx" ON "letter_step_history"("letterId");

-- CreateIndex
CREATE INDEX "letter_step_history_actorUserId_idx" ON "letter_step_history"("actorUserId");

-- CreateIndex
CREATE INDEX "letter_step_history_action_idx" ON "letter_step_history"("action");

-- CreateIndex
CREATE INDEX "letter_step_history_createdAt_idx" ON "letter_step_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "letter_numbering_letterId_key" ON "letter_numbering"("letterId");

-- CreateIndex
CREATE UNIQUE INDEX "letter_numbering_numberString_key" ON "letter_numbering"("numberString");

-- CreateIndex
CREATE INDEX "letter_numbering_numberString_idx" ON "letter_numbering"("numberString");

-- CreateIndex
CREATE INDEX "letter_numbering_date_idx" ON "letter_numbering"("date");

-- CreateIndex
CREATE UNIQUE INDEX "letter_numbering_letterTypeCode_date_counter_key" ON "letter_numbering"("letterTypeCode", "date", "counter");

-- CreateIndex
CREATE INDEX "attachment_letterId_idx" ON "attachment"("letterId");

-- CreateIndex
CREATE UNIQUE INDEX "permission_resource_action_key" ON "permission"("resource", "action");

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letter_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_step_history" ADD CONSTRAINT "letter_step_history_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letter_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_step_history" ADD CONSTRAINT "letter_step_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_numbering" ADD CONSTRAINT "letter_numbering_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letter_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_numbering" ADD CONSTRAINT "letter_numbering_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
