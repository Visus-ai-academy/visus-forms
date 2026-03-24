import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { StorageError, uploadToStorage } from "@/lib/services/storage";
import { getRequiredSession } from "@/lib/session";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE_MB = 5;

export async function POST(request: Request) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const result = await uploadToStorage(
      file,
      `design/${session.user.id}`,
      ALLOWED_TYPES,
      MAX_SIZE_MB
    );

    await (prisma.designUpload as any).create({
      data: {
        userId: session.user.id,
        originalName: result.originalName,
        storagePath: result.storagePath,
        storageUrl: result.storageUrl,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes,
      },
    });

    return NextResponse.json(
      { data: { url: result.storageUrl, filename: result.originalName } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
