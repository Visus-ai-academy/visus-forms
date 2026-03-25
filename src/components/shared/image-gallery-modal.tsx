"use client";

import { Check, ImagePlus, Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DesignUpload {
  id: string;
  originalName: string;
  storageUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface ImageGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  currentValue: string | null;
}

export function ImageGalleryModal({
  open,
  onOpenChange,
  onSelect,
  currentValue,
}: ImageGalleryModalProps) {
  const [uploads, setUploads] = useState<DesignUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/uploads");
      if (res.ok) {
        const { data } = await res.json();
        setUploads(data);
      }
    } catch {
      toast.error("Erro ao carregar imagens");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchUploads();
  }, [open, fetchUploads]);

  async function handleUpload(file: File) {
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
      onSelect(data.url);
      onOpenChange(false);
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro no upload");
    } finally {
      setIsUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function handleSelect(url: string) {
    onSelect(url);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Galeria de imagens</DialogTitle>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Botão de upload */}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full rounded-xl border-2 border-dashed border-on-surface/10 bg-surface-container-lowest px-4 py-4 text-center transition-colors hover:border-primary/30 hover:bg-primary-fixed/10 disabled:opacity-50 shrink-0"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                Enviar nova imagem
              </span>
            </div>
          )}
        </button>

        {/* Grid de imagens */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImagePlus className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                Nenhuma imagem enviada ainda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {uploads.map((upload) => {
                const isSelected = currentValue === upload.storageUrl;
                return (
                  <button
                    key={upload.id}
                    onClick={() => handleSelect(upload.storageUrl)}
                    className={cn(
                      "relative group rounded-lg overflow-hidden aspect-square transition-all",
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:ring-2 hover:ring-primary/30 hover:ring-offset-1"
                    )}
                  >
                    <img
                      src={upload.storageUrl}
                      alt={upload.originalName}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="rounded-full bg-primary p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white truncate">
                        {upload.originalName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
