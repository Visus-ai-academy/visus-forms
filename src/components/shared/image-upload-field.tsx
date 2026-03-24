"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro no upload");
        return;
      }

      const { data } = await res.json();
      onChange(data.url);
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

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-lg overflow-hidden">
          <img
            src={value}
            alt={label}
            className="w-full h-24 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => onChange(null)}
              className="rounded-lg bg-white/20 p-2 text-white hover:bg-red-500/80 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={isUploading}
          className="w-full rounded-lg border-2 border-dashed border-on-surface/10 bg-surface-container-lowest px-4 py-5 text-center transition-colors hover:border-primary/30 hover:bg-primary-fixed/10 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">
                Clique ou arraste uma imagem
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                JPG, PNG, GIF, WebP. Max 5MB
              </p>
            </>
          )}
        </button>
      )}
    </div>
  );
}
