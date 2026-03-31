-- DropForeignKey
ALTER TABLE "forms" DROP CONSTRAINT "forms_workflowId_fkey";

-- AlterTable
ALTER TABLE "forms" ALTER COLUMN "workflowId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
