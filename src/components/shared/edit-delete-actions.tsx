"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
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

interface EditDeleteActionsProps {
  entityName: string;
  entityLabel: string;
  currentName: string;
  currentDescription?: string | null;
  editEndpoint: string;
  deleteEndpoint: string;
}

export function EditDeleteActions({
  entityName,
  entityLabel,
  currentName,
  currentDescription,
  editEndpoint,
  deleteEndpoint,
}: EditDeleteActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || "");
  const [isLoading, setIsLoading] = useState(false);

  async function handleEdit() {
    setIsLoading(true);
    try {
      const res = await fetch(editEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });

      if (!res.ok) {
        toast.error(`Erro ao editar ${entityLabel}`);
        return;
      }

      toast.success(`${entityLabel} atualizado!`);
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      const res = await fetch(deleteEndpoint, { method: "DELETE" });

      if (!res.ok) {
        toast.error(`Erro ao excluir ${entityLabel}`);
        return;
      }

      toast.success(`${entityLabel} excluido!`);
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="flex gap-0.5"
      onClick={(e) => e.preventDefault()}
    >
      {/* Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          className="rounded-lg p-1.5 text-on-surface/40 hover:text-primary hover:bg-primary-fixed transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {entityLabel}</DialogTitle>
            <DialogDescription>
              Altere as informacoes do {entityLabel.toLowerCase()}.
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
                className="rounded-lg bg-surface-container-low border-0 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descricao (opcional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg bg-surface-container-low border-0"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <DialogClose className="px-4 py-2 text-sm rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-dim transition-colors">
                Cancelar
              </DialogClose>
              <button
                onClick={handleEdit}
                disabled={isLoading || !name.trim()}
                className="btn-primary-gradient px-5 py-2 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger
          className="rounded-lg p-1.5 text-on-surface/40 hover:text-destructive hover:bg-red-50 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {entityLabel}</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{entityName}</strong>? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <DialogClose className="px-4 py-2 text-sm rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-dim transition-colors">
              Cancelar
            </DialogClose>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold rounded-3xl bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Excluir
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
