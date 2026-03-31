"use client";

import Link from "next/link";

import { FormEditDeleteActions } from "@/components/shared/form-edit-delete-actions";
import { Badge } from "@/components/ui/badge";

interface FormCardProps {
  id: string;
  title: string;
  description: string | null;
  status: string;
  workspaceName?: string | null;
  workflowName?: string | null;
  slug?: string | null;
  questionsCount: number;
  responsesCount: number;
  updatedAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  PUBLISHED: { label: "Publicado", color: "bg-success/10 text-success" },
  CLOSED: { label: "Encerrado", color: "bg-destructive/10 text-destructive" },
};

export function FormCard({
  id,
  title,
  description,
  status,
  workspaceName,
  workflowName,
  slug,
  questionsCount,
  responsesCount,
  updatedAt,
}: FormCardProps) {
  const s = statusLabels[status] ?? statusLabels.DRAFT;

  return (
    <div className="group relative rounded-2xl bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-ambient">
      <Link href={`/builder/${id}`} className="absolute inset-0 rounded-2xl" aria-label={`Abrir ${title}`} />

      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold font-heading text-on-surface group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative z-10">
            <FormEditDeleteActions
              entityName={title}
              entityLabel="Formulário"
              currentTitle={title}
              currentDescription={description}
              editEndpoint={`/api/forms/${id}`}
              deleteEndpoint={`/api/forms/${id}`}
            />
          </div>
          <Badge className={`${s.color} border-0 text-[10px] font-semibold`}>
            {s.label}
          </Badge>
        </div>
      </div>

      {workspaceName && workflowName && (
        <p className="text-xs text-muted-foreground mb-3">
          {workspaceName} / {workflowName}
        </p>
      )}

      {slug && !workspaceName && (
        <p className="text-xs text-muted-foreground mb-3">/{slug}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <strong className="text-on-surface">{questionsCount}</strong> perguntas
        </span>
        <span>
          <strong className="text-on-surface">{responsesCount}</strong> respostas
        </span>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        Atualizado em {new Date(updatedAt).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
