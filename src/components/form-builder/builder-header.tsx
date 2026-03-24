"use client";

import { ArrowLeft, Check, Cloud, Eye, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { type BuilderTab, useFormBuilderStore } from "@/stores/form-builder-store";

interface BuilderHeaderProps {
  workspaceId: string;
  workflowId: string;
}

const tabs: { id: BuilderTab; label: string }[] = [
  { id: "editor", label: "Editor" },
  { id: "logica", label: "Logica" },
  { id: "design", label: "Design" },
  { id: "compartilhar", label: "Compartilhar" },
  { id: "respostas", label: "Respostas" },
];

export function BuilderHeader({ workspaceId, workflowId }: BuilderHeaderProps) {
  const router = useRouter();
  const { form, saveStatus, activeTab, setActiveTab, showPreview, togglePreview } = useFormBuilderStore();

  if (!form) return null;

  const isPublished = form.status === "PUBLISHED";

  async function handlePublish() {
    if (!form) return;

    const res = await fetch(`/api/forms/${form.id}/publish`, {
      method: isPublished ? "DELETE" : "POST",
    });

    if (!res.ok) {
      const result = await res.json();
      toast.error(result.error || "Erro ao alterar publicacao");
      return;
    }

    toast.success(isPublished ? "Formulario despublicado" : "Formulario publicado!");
    router.refresh();
  }

  return (
    <div className="glass-header flex h-14 items-center justify-between px-4 gap-4 z-10 shrink-0">
      {/* Esquerda */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/workspaces/${workspaceId}/workflows/${workflowId}`}>
          <button className="rounded-xl p-2 text-on-surface/50 hover:bg-surface-container-lowest transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <span className="text-sm font-bold font-heading text-on-surface">Editor de Formulario</span>
      </div>

      {/* Centro: abas */}
      <div className="hidden md:flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
              activeTab === tab.id
                ? "text-primary bg-primary-fixed"
                : "text-on-surface/50 hover:text-on-surface/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Direita */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {saveStatus === "saved" && <Check className="h-3 w-3 text-success" />}
          {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveStatus === "unsaved" && <Cloud className="h-3 w-3" />}
          {saveStatus === "error" && <X className="h-3 w-3 text-destructive" />}
        </div>

        <button
          onClick={togglePreview}
          className={`rounded-xl p-2 transition-colors ${
            showPreview
              ? "bg-primary-fixed text-primary"
              : "text-on-surface/50 hover:bg-surface-container-lowest"
          }`}
          title={showPreview ? "Fechar preview" : "Abrir preview"}
        >
          <Eye className="h-4 w-4" />
        </button>

        {isPublished && (
          <Badge className="bg-success/10 text-success border-0 text-[10px] font-semibold uppercase tracking-wider">
            Publicado
          </Badge>
        )}

        <button
          onClick={handlePublish}
          className="btn-primary-gradient px-5 py-2 text-xs font-semibold"
        >
          {isPublished ? "Despublicar" : "Publicar"}
        </button>
      </div>
    </div>
  );
}
