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
  // Validar tipo
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new StorageError("Tipo de arquivo não permitido");
  }

  // Validar tamanho
  const maxBytes = (maxSizeMb ?? 10) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new StorageError(`Arquivo muito grande. Máximo ${maxSizeMb ?? 10}MB`);
  }

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const storagePath = `${folder}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
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
    mimeType: file.type,
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
