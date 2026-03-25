import { randomUUID } from "crypto";

import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

export interface UploadResult {
  storagePath: string;
  storageUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Magic bytes conhecidos para detecção de tipo real do arquivo.
 * Não confiar no MIME type informado pelo cliente.
 */
const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
  // Imagens
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "image/bmp", bytes: [0x42, 0x4d] },
  { mime: "image/tiff", bytes: [0x49, 0x49, 0x2a, 0x00] },
  { mime: "image/tiff", bytes: [0x4d, 0x4d, 0x00, 0x2a] },
  // PDF
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  // ZIP (inclui DOCX, XLSX, PPTX)
  { mime: "application/zip", bytes: [0x50, 0x4b, 0x03, 0x04] },
];

/**
 * Detecta o MIME type real do arquivo a partir dos magic bytes.
 * Retorna null se não conseguir detectar (fallback para file.type).
 */
function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const entry of MAGIC_BYTES) {
    if (buffer.length < entry.bytes.length) continue;

    const matches = entry.bytes.every(
      (byte, index) => buffer[index] === byte
    );

    if (matches) {
      return entry.mime;
    }
  }

  return null;
}

/**
 * Faz upload de um arquivo para o Supabase Storage.
 * @param file - Arquivo (File ou Buffer com metadata)
 * @param folder - Pasta no bucket (ex: "design/userId" ou "responses/formId/questionId")
 * @param allowedTypes - MIME types permitidos (opcional)
 * @param maxSizeMb - Tamanho máximo em MB (padrão 10)
 */
export async function uploadToStorage(
  file: File,
  folder: string,
  allowedTypes?: string[],
  maxSizeMb?: number
): Promise<UploadResult> {
  // Validar tamanho
  const maxBytes = (maxSizeMb ?? 10) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new StorageError(`Arquivo muito grande. Máximo ${maxSizeMb ?? 10}MB`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Detectar tipo real do arquivo via magic bytes (não confiar no cliente)
  const detectedMime = detectMimeFromBuffer(buffer);
  const actualMime = detectedMime ?? file.type;

  // Validar tipo usando o MIME detectado
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(actualMime)) {
    throw new StorageError("Tipo de arquivo não permitido");
  }

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const storagePath = `${folder}/${filename}`;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: actualMime,
      upsert: false,
    });

  if (error) {
    throw new StorageError(`Erro no upload: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    storageUrl: urlData.publicUrl,
    originalName: file.name,
    mimeType: actualMime,
    sizeBytes: file.size,
  };
}

/**
 * Remove um arquivo do Supabase Storage.
 */
export async function deleteFromStorage(storagePath: string): Promise<void> {
  const { error } = await getSupabaseAdmin().storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new StorageError(`Erro ao deletar: ${error.message}`);
  }
}
