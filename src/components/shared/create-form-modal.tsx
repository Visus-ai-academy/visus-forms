"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateFormModalProps {
  workflowId: string;
  trigger: React.ReactNode;
}

export function CreateFormModal({ workflowId, trigger }: CreateFormModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setNameError("Nome é obrigatório");
      return;
    }
    setNameError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          workflowId,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Erro ao criar formulário");
        return;
      }

      const { data: form } = await res.json();
      toast.success("Formulário criado com sucesso!");
      setOpen(false);
      setTitle("");
      setDescription("");
      router.push(`/builder/${form.id}`);
    } catch {
      toast.error("Erro ao criar formulário");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Formulário</DialogTitle>
          <DialogDescription>
            Crie um novo formulário para este workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Título
            </Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (nameError) setNameError(null); }}
              placeholder="Ex: Pesquisa de Satisfação Q1"
              className={`rounded-lg bg-surface-container-low border-0 h-11 ${nameError ? "ring-2 ring-destructive" : ""}`}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição (opcional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o formulário..."
              className="rounded-lg bg-surface-container-low border-0"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <DialogClose className="px-4 py-2 text-sm rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-dim transition-colors">
              Cancelar
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={isLoading || !title.trim()}
              className="btn-primary-gradient px-5 py-2 text-sm font-semibold"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Criar Formulário
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
