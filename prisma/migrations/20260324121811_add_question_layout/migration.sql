-- CreateTable
CREATE TABLE "question_layouts" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "breakpoint" TEXT NOT NULL DEFAULT 'desktop',
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "w" INTEGER NOT NULL DEFAULT 12,
    "h" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "question_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_layouts_questionId_idx" ON "question_layouts"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "question_layouts_questionId_breakpoint_key" ON "question_layouts"("questionId", "breakpoint");

-- AddForeignKey
ALTER TABLE "question_layouts" ADD CONSTRAINT "question_layouts_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
