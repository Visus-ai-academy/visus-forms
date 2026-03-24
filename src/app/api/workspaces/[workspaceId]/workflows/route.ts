import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createWorkflowSchema } from "@/lib/schemas/workspace";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId } = await params;

  const isMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }

  const workflows = await prisma.workflow.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { forms: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data: workflows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId } = await params;

  const isMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = createWorkflowSchema.parse(body);

    const maxOrder = await prisma.workflow.findFirst({
      where: { workspaceId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const workflow = await prisma.workflow.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ data: workflow }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
}
