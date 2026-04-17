"use client";

import { Loader2, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";

interface RemoveMemberButtonProps {
  workspaceId: string;
  memberId: string;
  memberName: string;
}

export function RemoveMemberButton({
  workspaceId,
  memberId,
  memberName,
}: RemoveMemberButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRemove() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        toast.error("Erro ao remover membro");
        return;
      }

      toast.success("Membro removido!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="rounded-lg p-1.5 text-on-surface/40 hover:text-destructive hover:bg-red-50 transition-colors"
        onClick={() => setOpen(true)}
        aria-label={`Remover ${memberName}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{memberName}</strong> do
              workspace? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <DialogClose className="px-4 py-2 text-sm rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-dim transition-colors">
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-destructive text-white hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
