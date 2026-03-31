-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'ADDRESS';

-- CreateTable
CREATE TABLE "form_webhooks" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "questionIds" TEXT[],
    "secret" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_webhooks_formId_idx" ON "form_webhooks"("formId");

-- AddForeignKey
ALTER TABLE "form_webhooks" ADD CONSTRAINT "form_webhooks_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
