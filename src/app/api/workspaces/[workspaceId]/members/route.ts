import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "@/lib/schemas/workspace";
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
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId } = await params;

  const currentMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
  });

  if (!currentMember) {
    return NextResponse.json({ error: "Sem permissão para convidar membros" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = inviteMemberSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Usuario ja e membro" }, { status: 409 });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: data.role,
      },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
