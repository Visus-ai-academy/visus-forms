import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WorkspacesPage() {
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
      <div className="px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface font-heading">Workspaces</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus workspaces e equipes</p>
        </div>
        {workspaces.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-12 text-center">
            <p className="text-muted-foreground mb-4">Voce ainda nao tem nenhum workspace</p>
            <Link href="/dashboard/workspaces/new">
              <button className="btn-primary-gradient px-6 py-2.5 text-sm font-semibold">
                <Plus className="mr-2 h-4 w-4 inline" />
                Criar primeiro workspace
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Link key={workspace.id} href={`/dashboard/workspaces/${workspace.id}`}>
                <div className="group rounded-2xl bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-ambient">
                  <h3 className="font-bold font-heading text-on-surface mb-1 group-hover:text-primary transition-colors">
                    {workspace.name}
                  </h3>
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

            <Link href="/dashboard/workspaces/new">
              <div className="group rounded-2xl border-2 border-dashed border-outline-variant/30 p-5 flex flex-col items-center justify-center text-center min-h-[120px] transition-colors hover:border-primary/30 hover:bg-primary-fixed/20">
                <Plus className="h-6 w-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  Novo Workspace
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
