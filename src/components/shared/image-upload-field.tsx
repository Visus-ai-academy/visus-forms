"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Label } from "@/components/ui/label";

import { ImageGalleryModal } from "./image-gallery-modal";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>

      {value ? (
        <div className="relative group rounded-lg overflow-hidden">
          <img
            src={value}
            alt={label}
            className="w-full h-24 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => setGalleryOpen(true)}
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
          onClick={() => setGalleryOpen(true)}
          className="w-full rounded-lg border-2 border-dashed border-on-surface/10 bg-surface-container-lowest px-4 py-5 text-center transition-colors hover:border-primary/30 hover:bg-primary-fixed/10"
        >
          <ImagePlus className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">
            Clique para escolher uma imagem
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            JPG, PNG, GIF, WebP. Max 5MB
          </p>
        </button>
      )}

      <ImageGalleryModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={(url) => onChange(url)}
        currentValue={value}
      />
    </div>
  );
}
