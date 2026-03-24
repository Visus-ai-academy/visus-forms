"use client";

import { File as FileIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export interface FileUploadValue {
  url: string;
  storagePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

interface FileUploadFieldProps {
  value: FileUploadValue[];
  onChange: (value: FileUploadValue[]) => void;
  config?: Record<string, unknown>;
  formSlug: string;
  questionId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadField({
  value,
  onChange,
  config = {},
  formSlug,
  questionId,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const maxFiles = (config.maxFiles as number) || 1;
  const maxSizeMb = (config.maxSizeMb as number) || 10;
  const allowedMimeTypes = config.allowedMimeTypes as string[] | undefined;
  const canAddMore = value.length < maxFiles;

  // Se não tem formSlug, é preview do builder — mostrar estado estático
  if (!formSlug) {
    return (
      <div className="rounded-xl border-2 border-dashed border-on-surface/10 bg-surface-container-lowest p-8 text-center">
        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Upload de arquivos</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Máximo {maxFiles} arquivo{maxFiles > 1 ? "s" : ""} — até {maxSizeMb}MB
        </p>
      </div>
    );
  }

  async function handleFile(file: File) {
    // Validação client-side
    if (allowedMimeTypes && allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido");
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${maxSizeMb}MB`);
      return;
    }

    if (value.length >= maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivo${maxFiles > 1 ? "s" : ""}`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionId", questionId);

      const res = await fetch(`/api/submit/${formSlug}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro no upload");
        return;
      }

      const { data } = await res.json();
      onChange([...value, data as FileUploadValue]);
    } catch {
      toast.error("Erro no upload");
    } finally {
      setIsUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const acceptAttr = allowedMimeTypes?.join(",") || undefined;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Arquivos já enviados */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={file.storagePath}
              className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-3"
            >
              <div className="shrink-0 rounded-lg bg-primary-fixed p-2">
                <FileIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {file.originalName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(file.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zona de upload */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={isUploading}
          className="w-full rounded-xl border-2 border-dashed border-on-surface/10 bg-surface-container-lowest px-4 py-6 text-center transition-colors hover:border-primary/30 hover:bg-primary-fixed/10 disabled:opacity-50"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Enviando...</p>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Clique ou arraste um arquivo
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Máximo {maxSizeMb}MB
                {maxFiles > 1 && ` — ${value.length}/${maxFiles} arquivos`}
              </p>
            </>
          )}
        </button>
      )}
    </div>
  );
}
