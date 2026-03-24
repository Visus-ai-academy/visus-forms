import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CreateFormModal } from "@/components/shared/create-form-modal";
import { Badge } from "@/components/ui/badge";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  CLOSED: "Fechado",
  ARCHIVED: "Arquivado",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-surface-container-high text-muted-foreground",
  PUBLISHED: "bg-success/10 text-success",
  CLOSED: "bg-destructive/10 text-destructive",
  ARCHIVED: "bg-surface-container-high text-muted-foreground",
};

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; workflowId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { workspaceId, workflowId } = await params;

  const isMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id },
  });

  if (!isMember) notFound();

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId },
    include: {
      forms: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          createdAt: true,
          _count: { select: { responses: true, questions: true } },
        },
      },
    },
  });

  if (!workflow) notFound();

  return (
    <>
      <div className="px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-on-surface font-heading">{workflow.name}</h1>
            {workflow.description && <p className="text-sm text-muted-foreground">{workflow.description}</p>}
          </div>
          <CreateFormModal
            workflowId={workflowId}
            trigger={
              <span className="btn-primary-gradient px-5 py-2 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Novo Formulario
              </span>
            }
          />
        </div>

        {workflow.forms.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum formulário criado neste workflow
            </p>
            <CreateFormModal
              workflowId={workflowId}
              trigger={
                <span className="btn-primary-gradient px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Criar primeiro formulario
                </span>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflow.forms.map((form) => (
              <Link key={form.id} href={`/builder/${form.id}`}>
                <div className="group rounded-2xl bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-ambient">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold font-heading text-on-surface group-hover:text-primary transition-colors">
                      {form.title}
                    </h3>
                    <Badge className={`border-0 text-[10px] font-semibold uppercase tracking-wider ${statusColors[form.status]}`}>
                      {statusLabels[form.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">/{form.slug}</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Perguntas</p>
                      <p className="text-lg font-bold font-heading text-on-surface">{form._count.questions}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Respostas</p>
                      <p className="text-lg font-bold font-heading text-on-surface">{form._count.responses}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
