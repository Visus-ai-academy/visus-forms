import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId, memberId } = await params;

  const currentMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
  });

  if (!currentMember) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const target = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!target) {
    return NextResponse.json({ error: "Membro nao encontrado neste workspace" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Nao e possivel alterar role do owner" }, { status: 403 });
  }

  if (target.role === "ADMIN" && currentMember.role === "ADMIN") {
    return NextResponse.json({ error: "Admin nao pode alterar role de outro admin" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = updateRoleSchema.parse(body);

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: data.role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { workspaceId, memberId } = await params;

  const currentMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: "OWNER" },
  });

  if (!currentMember) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const target = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!target) {
    return NextResponse.json({ error: "Membro nao encontrado neste workspace" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Nao e possivel remover o owner" }, { status: 403 });
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  return NextResponse.json({ data: { success: true } });
}
