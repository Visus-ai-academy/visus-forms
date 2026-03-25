import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getClientIp, RateLimiter } from "@/lib/rate-limit";
import { StorageError, uploadToStorage } from "@/lib/services/storage";

// Rate limiter: 10 uploads por minuto por IP
const uploadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ formSlug: string }> }
) {
  // Rate limiting por IP
  const clientIp = getClientIp(request);
  const { allowed, retryAfterMs } = uploadRateLimiter.check(clientIp);

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      }
    );
  }

  const { formSlug } = await params;

  const form = await prisma.form.findFirst({
    where: { slug: formSlug, status: "PUBLISHED" },
    include: {
      questions: {
        where: { type: "FILE_UPLOAD" },
        select: { id: true, config: true },
      },
    },
  });

  if (!form) {
    return NextResponse.json(
      { error: "Formulário não encontrado ou não publicado" },
      { status: 404 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const questionId = formData.get("questionId") as string | null;

    if (!file || !questionId) {
      return NextResponse.json(
        { error: "Arquivo e questionId são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar que a pergunta pertence ao form e é FILE_UPLOAD
    const question = form.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Pergunta não encontrada neste formulário" },
        { status: 400 }
      );
    }

    // Extrair config da pergunta
    const config = (question.config ?? {}) as Record<string, unknown>;
    const allowedMimeTypes = config.allowedMimeTypes as string[] | undefined;
    const maxSizeMb = (config.maxSizeMb as number) ?? 10;

    const result = await uploadToStorage(
      file,
      `responses/${form.id}/${questionId}`,
      allowedMimeTypes,
      maxSizeMb
    );

    return NextResponse.json(
      {
        data: {
          url: result.storageUrl,
          storagePath: result.storagePath,
          originalName: result.originalName,
          mimeType: result.mimeType,
          sizeBytes: result.sizeBytes,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
