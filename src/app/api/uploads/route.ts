import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

import { getRequiredSession } from "@/lib/session";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const { error } = await getRequiredSession();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido. Use JPG, PNG, GIF, WebP ou SVG." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Maximo 5MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "png";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ data: { url, filename } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
