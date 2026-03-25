import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FormsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const forms = await prisma.form.findMany({
    where: {
      workflow: {
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    },
    include: {
      workflow: {
        select: {
          name: true,
          workspace: { select: { name: true } },
        },
      },
      _count: { select: { questions: true, responses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
    PUBLISHED: { label: "Publicado", color: "bg-success/10 text-success" },
    CLOSED: { label: "Encerrado", color: "bg-destructive/10 text-destructive" },
  };

  return (
    <div className="px-8 py-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Formulários</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface font-heading">
            Formulários
          </h1>
          <p className="text-sm text-muted-foreground">
            Todos os formulários dos seus workspaces
          </p>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Nenhum formulário encontrado. Crie um formulário dentro de um workflow.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => {
            const s = statusLabels[form.status] ?? statusLabels.DRAFT;
            return (
              <Link key={form.id} href={`/builder/${form.id}`}>
                <div className="group rounded-2xl bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-ambient">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold font-heading text-on-surface group-hover:text-primary transition-colors">
                      {form.title}
                    </h3>
                    <Badge className={`${s.color} border-0 text-[10px] font-semibold shrink-0`}>
                      {s.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    {form.workflow.workspace.name} / {form.workflow.name}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <strong className="text-on-surface">{form._count.questions}</strong> perguntas
                    </span>
                    <span>
                      <strong className="text-on-surface">{form._count.responses}</strong> respostas
                    </span>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-3">
                    Atualizado em {new Date(form.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
