import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Header } from "@/components/dashboard/header";
import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { CreateWorkspaceModal } from "@/components/shared/create-workspace-modal";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      _count: { select: { workflows: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header title="Workspaces" description="Gerencie seus workspaces e equipes" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-end">
          <CreateWorkspaceModal
            trigger={
              <span className="btn-primary-gradient px-5 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Novo Workspace
              </span>
            }
          />
        </div>

        {workspaces.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-12 text-center">
            <p className="text-muted-foreground mb-4">Voce ainda nao tem nenhum workspace</p>
            <CreateWorkspaceModal
              trigger={
                <span className="btn-primary-gradient px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Criar primeiro workspace
                </span>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Link key={workspace.id} href={`/dashboard/workspaces/${workspace.id}`}>
                <div className="group rounded-2xl bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-ambient">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold font-heading text-on-surface group-hover:text-primary transition-colors">
                      {workspace.name}
                    </h3>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditDeleteActions
                        entityName={workspace.name}
                        entityLabel="Workspace"
                        currentName={workspace.name}
                        currentDescription={workspace.description}
                        editEndpoint={`/api/workspaces/${workspace.id}`}
                        deleteEndpoint={`/api/workspaces/${workspace.id}`}
                      />
                    </div>
                  </div>
                  {workspace.description && (
                    <p className="text-xs text-muted-foreground mb-4">{workspace.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{workspace._count.workflows} workflows</span>
                    <span>{workspace._count.members} membros</span>
                  </div>
                </div>
              </Link>
            ))}

            <CreateWorkspaceModal
              trigger={
                <div className="group rounded-2xl border-2 border-dashed border-outline-variant/30 p-5 flex flex-col items-center justify-center text-center min-h-[120px] transition-colors hover:border-primary/30 hover:bg-primary-fixed/20 cursor-pointer">
                  <Plus className="h-6 w-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                    Novo Workspace
                  </p>
                </div>
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
