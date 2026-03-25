"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
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

      toast.success(`${entityLabel} excluído!`);
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
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Editar */}
      <button
        type="button"
        className="rounded-lg p-1.5 text-on-surface/40 hover:text-primary hover:bg-primary-fixed transition-colors"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditOpen(true); }}
        aria-label={`Editar ${entityLabel}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {entityLabel}</DialogTitle>
            <DialogDescription>
              Altere as informações do {entityLabel.toLowerCase()}.
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
                Descrição (opcional)
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
              <Button
                onClick={handleEdit}
                disabled={isLoading || !name.trim()}
                className="btn-primary-gradient px-5 py-2 text-sm font-semibold"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <button
        type="button"
        className="rounded-lg p-1.5 text-on-surface/40 hover:text-destructive hover:bg-red-50 transition-colors"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteOpen(true); }}
        aria-label={`Excluir ${entityLabel}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {entityLabel}</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{entityName}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <DialogClose className="px-4 py-2 text-sm rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-dim transition-colors">
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-destructive text-white hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
