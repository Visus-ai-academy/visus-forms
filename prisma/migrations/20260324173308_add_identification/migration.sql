-- AlterTable
ALTER TABLE "form_responses" ADD COLUMN     "respondentCpf" TEXT,
ADD COLUMN     "respondentEmail" TEXT,
ADD COLUMN     "respondentName" TEXT,
ADD COLUMN     "respondentPhone" TEXT;

-- AlterTable
ALTER TABLE "form_settings" ADD COLUMN     "identificationFields" TEXT[],
ADD COLUMN     "identificationMode" TEXT NOT NULL DEFAULT 'anonymous';
