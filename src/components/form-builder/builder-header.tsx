"use client";

import { ArrowLeft, Check, Cloud, Eye, Loader2, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type BuilderTab, useFormBuilderStore } from "@/stores/form-builder-store";

interface BuilderHeaderProps {
  workspaceId: string;
  workflowId: string;
}

const tabs: { id: BuilderTab; label: string }[] = [
  { id: "editor", label: "Editor" },
  { id: "logica", label: "Lógica" },
  { id: "design", label: "Design" },
  { id: "compartilhar", label: "Compartilhar" },
  { id: "respostas", label: "Respostas" },
];

export function BuilderHeader({ workspaceId, workflowId }: BuilderHeaderProps) {
  const router = useRouter();
  const { form, saveStatus, activeTab, setActiveTab, showPreview, togglePreview } = useFormBuilderStore();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!form) return null;

  const isPublished = form.status === "PUBLISHED";

  async function handlePublish() {
    if (!form) return;

    const res = await fetch(`/api/forms/${form.id}/publish`, {
      method: isPublished ? "DELETE" : "POST",
    });

    if (!res.ok) {
      const result = await res.json();
      toast.error(result.error || "Erro ao alterar publicação");
      return;
    }

    toast.success(isPublished ? "Formulário despublicado" : "Formulário publicado!");
    router.refresh();
  }

  return (
    <div className="glass-header flex h-14 items-center justify-between px-4 gap-4 z-10 shrink-0">
      {/* Esquerda */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/workspaces/${workspaceId}/workflows/${workflowId}`}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-on-surface/50 hover:bg-surface-container-lowest"
            aria-label="Voltar ao dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm font-bold font-heading text-on-surface">Editor de Formulário</span>
      </div>

      {/* Centro: abas (desktop) */}
      <div className="hidden md:flex items-center gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg ${
              activeTab === tab.id
                ? "text-primary bg-primary-fixed"
                : "text-on-surface/50 hover:text-on-surface/80"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Centro: menu mobile */}
      <div className="flex md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-on-surface/50 hover:bg-surface-container-lowest"
                aria-label="Abrir menu de navegação"
              />
            }
          >
            <Menu className="h-4 w-4 mr-1.5" />
            {tabs.find((t) => t.id === activeTab)?.label}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl" showCloseButton={false}>
            <SheetHeader>
              <SheetTitle>Navegação</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 p-4 pt-0">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className={`justify-start rounded-xl px-4 py-3 text-sm font-semibold h-auto ${
                    activeTab === tab.id
                      ? "text-primary bg-primary-fixed"
                      : "text-on-surface/60 hover:text-on-surface/80"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 text-xs text-muted-foreground">
              {saveStatus === "saved" && <Check className="h-3 w-3 text-success" />}
              {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
              {saveStatus === "unsaved" && <Cloud className="h-3 w-3" />}
              {saveStatus === "error" && <X className="h-3 w-3 text-destructive" />}
            </TooltipTrigger>
            <TooltipContent>
              {saveStatus === "saved" && "Salvo"}
              {saveStatus === "saving" && "Salvando..."}
              {saveStatus === "unsaved" && "Alterações não salvas"}
              {saveStatus === "error" && "Erro ao salvar"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePreview}
          aria-label={showPreview ? "Fechar preview" : "Abrir preview"}
          className={`rounded-xl ${
            showPreview
              ? "bg-primary-fixed text-primary"
              : "text-on-surface/50 hover:bg-surface-container-lowest"
          }`}
        >
          <Eye className="h-4 w-4" />
        </Button>

        {isPublished && (
          <Badge className="bg-success/10 text-success border-0 text-[10px] font-semibold uppercase tracking-wider">
            Publicado
          </Badge>
        )}

        <Button
          onClick={() => setShowPublishDialog(true)}
          className="btn-primary-gradient px-5 py-2 text-xs font-semibold"
        >
          {isPublished ? "Despublicar" : "Publicar"}
        </Button>
      </div>

      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPublished ? "Despublicar formulário?" : "Publicar formulário?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPublished
                ? "O formulário não estará mais acessível. Respondentes ativos podem ser afetados."
                : "O formulário ficará acessível publicamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowPublishDialog(false); handlePublish(); }}
            >
              {isPublished ? "Despublicar" : "Publicar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
