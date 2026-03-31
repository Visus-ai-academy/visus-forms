-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'CPF';

-- AlterTable
ALTER TABLE "form_responses" ADD COLUMN     "respondentBirthDate" TEXT,
ADD COLUMN     "respondentGender" TEXT;
