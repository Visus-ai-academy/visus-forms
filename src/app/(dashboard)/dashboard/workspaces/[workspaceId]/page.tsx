import { FileText, Plus, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { CreateWorkflowModal } from "@/components/shared/create-workflow-modal";
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

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      workflows: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { forms: true } },
        },
      },
    },
  });

  if (!workspace) notFound();

  return (
    <>
      <div className="px-8 py-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{workspace.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface font-heading">{workspace.name}</h1>
          {workspace.description && <p className="text-sm text-muted-foreground">{workspace.description}</p>}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Workflows */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading text-on-surface">Workflows</h2>
              <CreateWorkflowModal
                workspaceId={workspaceId}
                trigger={
                  <span className="btn-primary-gradient px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <Plus className="h-3.5 w-3.5" />
                    Novo Workflow
                  </span>
                }
              />
            </div>

            {workspace.workflows.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest p-8 text-center">
                <p className="text-muted-foreground mb-4">Nenhum workflow criado ainda</p>
                <CreateWorkflowModal
                  workspaceId={workspaceId}
                  trigger={
                    <span className="btn-primary-gradient px-5 py-2 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
                      <Plus className="h-4 w-4" />
                      Criar primeiro workflow
                    </span>
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {workspace.workflows.map((workflow) => (
                  <Link
                    key={workflow.id}
                    href={`/dashboard/workspaces/${workspaceId}/workflows/${workflow.id}`}
                  >
                    <div className="group rounded-2xl bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-ambient">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold font-heading text-on-surface group-hover:text-primary transition-colors">
                            {workflow.name}
                          </h3>
                          {workflow.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{workflow.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <Badge className="bg-surface-container-high text-muted-foreground border-0 text-[10px] font-semibold">
                            <FileText className="h-3 w-3 mr-1" />
                            {workflow._count.forms} formulários
                          </Badge>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <EditDeleteActions
                              entityName={workflow.name}
                              entityLabel="Workflow"
                              currentName={workflow.name}
                              currentDescription={workflow.description}
                              editEndpoint={`/api/workspaces/${workspaceId}/workflows/${workflow.id}`}
                              deleteEndpoint={`/api/workspaces/${workspaceId}/workflows/${workflow.id}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Membros */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold font-heading text-on-surface">
              <Users className="mr-2 h-4 w-4 inline" />
              Membros ({workspace.members.length})
            </h2>
            <div className="rounded-2xl bg-surface-container-lowest divide-y divide-border">
              {workspace.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                  <Badge className="bg-surface-container-high text-muted-foreground border-0 text-[10px] font-semibold">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Criado em {new Date(workspace.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
