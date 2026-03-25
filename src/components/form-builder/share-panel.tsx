"use client";

import {
  Check,
  Code,
  Copy,
  ExternalLink,
  Globe,
  Link,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormBuilderStore } from "@/stores/form-builder-store";

interface SharePanelProps {
  formId: string;
}

export function SharePanel({ formId }: SharePanelProps) {
  const { form } = useFormBuilderStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("600");
  const qrRef = useRef<HTMLDivElement>(null);

  if (!form) return null;

  const isPublished = form.status === "PUBLISHED";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl = `${baseUrl}/f/${form.slug}`;

  const embedCode = `<iframe src="${formUrl}" width="${embedWidth}" height="${embedHeight}px" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadQR() {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${form?.slug || "form"}-qrcode.png`;
      a.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-fixed p-2.5">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-on-surface">
                Compartilhar
              </h2>
              <p className="text-sm text-muted-foreground">
                Compartilhe seu formulário com um link, QR code ou embed.
              </p>
            </div>
          </div>

          {/* Status */}
          {!isPublished && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-700">
                O formulário precisa estar <strong>publicado</strong> para ser acessado pelo link público.{" "}
                Clique em &ldquo;Publicar&rdquo; no canto superior direito.
              </p>
            </div>
          )}

          {/* Link direto */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">Link direto</h3>
              {isPublished && (
                <Badge className="bg-success/10 text-success border-0 text-[10px]">Ativo</Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={formUrl}
                readOnly
                className="flex-1 bg-surface-container-low border-0 text-sm font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(formUrl, "link")}
                className="shrink-0 rounded-xl bg-primary-fixed px-4 py-2 text-xs font-semibold text-primary hover:bg-primary-fixed/80"
              >
                {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === "link" ? "Copiado" : "Copiar"}
              </Button>
              {isPublished && (
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-xl bg-surface-container-low px-4 py-2 text-xs font-semibold text-on-surface/60 hover:text-on-surface transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir
                </a>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">QR Code</h3>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={formUrl} size={200} level="H" />
              </div>
              <Button
                variant="link"
                onClick={downloadQR}
                className="text-xs font-semibold text-primary hover:text-primary/80"
              >
                Baixar QR Code (PNG)
              </Button>
            </div>
          </div>

          {/* Embed */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">Incorporar (Embed)</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Copie o código abaixo e cole no HTML do seu site para incorporar o formulário.
            </p>

            <div className="flex gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Largura
                </label>
                <Input
                  value={embedWidth}
                  onChange={(e) => setEmbedWidth(e.target.value)}
                  className="w-24 bg-surface-container-low border-0 text-xs h-8"
                  placeholder="100%"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Altura (px)
                </label>
                <Input
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(e.target.value)}
                  className="w-24 bg-surface-container-low border-0 text-xs h-8"
                  placeholder="600"
                />
              </div>
            </div>

            <div className="relative">
              <pre className="bg-surface-container-low rounded-xl p-4 text-xs text-on-surface/80 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {embedCode}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(embedCode, "embed")}
                className="absolute top-2 right-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-[10px] font-semibold text-primary hover:bg-white"
              >
                {copied === "embed" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === "embed" ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
