"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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

interface CreateWorkspaceModalProps {
  trigger: React.ReactNode;
}

export function CreateWorkspaceModal({ trigger }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Erro ao criar workspace");
        return;
      }

      const { data: workspace } = await res.json();
      toast.success("Workspace criado com sucesso!");
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/dashboard/workspaces/${workspace.id}`);
      router.refresh();
    } catch {
      toast.error("Erro ao criar workspace");
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
          <DialogTitle>Novo Workspace</DialogTitle>
          <DialogDescription>
            Crie um workspace para organizar seus formularios e equipes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meu Workspace"
              className="rounded-lg bg-surface-container-low border-0 h-11"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição (opcional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o workspace..."
              className="rounded-lg bg-surface-container-low border-0"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <DialogClose className="px-4 py-2 text-sm rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-dim transition-colors">
              Cancelar
            </DialogClose>
            <button
              onClick={handleCreate}
              disabled={isLoading || !name.trim()}
              className="btn-primary-gradient px-5 py-2 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Criar Workspace
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
