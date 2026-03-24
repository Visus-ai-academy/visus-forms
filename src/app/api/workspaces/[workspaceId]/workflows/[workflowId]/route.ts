import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateWorkflowSchema } from "@/lib/schemas/workspace";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; workflowId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId, workflowId } = await params;

  const isMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

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
          updatedAt: true,
          _count: { select: { responses: true } },
        },
      },
    },
  });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: workflow });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; workflowId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId, workflowId } = await params;

  const isMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = updateWorkflowSchema.parse(body);

    const updated = await prisma.workflow.update({
      where: { id: workflowId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; workflowId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId, workflowId } = await params;

  const isMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.workflow.delete({ where: { id: workflowId } });

  return NextResponse.json({ data: { success: true } });
}
