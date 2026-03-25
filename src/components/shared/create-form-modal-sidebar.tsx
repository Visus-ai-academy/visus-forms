"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Workspace {
  id: string;
  name: string;
}

interface Workflow {
  id: string;
  name: string;
}

interface CreateFormModalSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFormModalSidebar({ open, onOpenChange }: CreateFormModalSidebarProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    setLoadingWorkspaces(true);
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const { data } = await res.json();
        setWorkspaces(data ?? []);
      }
    } catch {
      // silencioso
    } finally {
      setLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadWorkspaces();
      setTitle("");
      setDescription("");
      setSelectedWorkspaceId("");
      setSelectedWorkflowId("");
      setWorkflows([]);
    }
  }, [open, loadWorkspaces]);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setWorkflows([]);
      setSelectedWorkflowId("");
      return;
    }

    async function loadWorkflows() {
      setLoadingWorkflows(true);
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspaceId}/workflows`);
        if (res.ok) {
          const { data } = await res.json();
          setWorkflows(data ?? []);
        }
      } catch {
        // silencioso
      } finally {
        setLoadingWorkflows(false);
      }
    }

    loadWorkflows();
  }, [selectedWorkspaceId]);

  async function handleCreate() {
    if (!title.trim() || !selectedWorkflowId) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          workflowId: selectedWorkflowId,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Erro ao criar formulário");
        return;
      }

      const { data: form } = await res.json();
      toast.success("Formulário criado com sucesso!");
      onOpenChange(false);
      router.push(`/builder/${form.id}`);
    } catch {
      toast.error("Erro ao criar formulário");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Formulário</DialogTitle>
          <DialogDescription>
            Selecione o workspace e workflow, depois preencha os dados do formulário.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </Label>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              disabled={loadingWorkspaces}
              className="w-full rounded-lg bg-surface-container-low border-0 h-11 px-3 text-sm text-on-surface"
              aria-label="Selecionar workspace"
            >
              <option value="">
                {loadingWorkspaces ? "Carregando..." : "Selecione um workspace"}
              </option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workflow
            </Label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              disabled={!selectedWorkspaceId || loadingWorkflows}
              className="w-full rounded-lg bg-surface-container-low border-0 h-11 px-3 text-sm text-on-surface disabled:opacity-50"
              aria-label="Selecionar workflow"
            >
              <option value="">
                {loadingWorkflows
                  ? "Carregando..."
                  : !selectedWorkspaceId
                    ? "Selecione um workspace primeiro"
                    : workflows.length === 0
                      ? "Nenhum workflow encontrado"
                      : "Selecione um workflow"}
              </option>
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Título
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Pesquisa de Satisfação Q1"
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
              disabled={isLoading || !title.trim() || !selectedWorkflowId}
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
