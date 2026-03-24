import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateWorkspaceSchema } from "@/lib/schemas/workspace";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

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
      members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      workflows: { orderBy: { order: "asc" } },
      _count: { select: { workflows: true, members: true } },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: workspace });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: session.user.id },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado ou sem permissao" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updateWorkspaceSchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: session.user.id },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado ou sem permissao" }, { status: 404 });
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });

  return NextResponse.json({ data: { success: true } });
}
