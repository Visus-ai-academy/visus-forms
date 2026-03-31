import { FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CreateFormButton } from "@/components/shared/create-form-button";
import { FormCard } from "@/components/shared/form-card";
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
      OR: [
        {
          workflow: {
            workspace: {
              members: { some: { userId: session.user.id } },
            },
          },
        },
        {
          creatorId: session.user.id,
          workflowId: null,
        },
      ],
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
            Todos os seus formulários
          </p>
        </div>
        <CreateFormButton />
      </div>

      {forms.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhum formulário encontrado.
          </p>
          <CreateFormButton
            label="Criar primeiro formulário"
            className="btn-primary-gradient px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              id={form.id}
              title={form.title}
              description={form.description}
              status={form.status}
              workspaceName={form.workflow?.workspace.name ?? null}
              workflowName={form.workflow?.name ?? null}
              questionsCount={form._count.questions}
              responsesCount={form._count.responses}
              updatedAt={form.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
