-- CreateTable
CREATE TABLE "design_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "design_uploads_userId_idx" ON "design_uploads"("userId");

-- AddForeignKey
ALTER TABLE "design_uploads" ADD CONSTRAINT "design_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
