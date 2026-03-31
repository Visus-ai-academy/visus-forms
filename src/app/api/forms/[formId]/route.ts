import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateFormSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      OR: [
        { creatorId: session.user.id },
        {
          workflow: {
            workspace: {
              members: { some: { userId: session.user.id } },
            },
          },
        },
      ],
    },
    include: {
      settings: true,
      theme: true,
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
          conditionalRules: true,
          layouts: true,
        },
      },
      workflow: {
        select: { id: true, name: true, workspaceId: true },
      },
      _count: { select: { responses: true } },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: form });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      OR: [
        { creatorId: session.user.id },
        {
          workflow: {
            workspace: {
              members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } } },
            },
          },
        },
      ],
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updateFormSchema.parse(body);

    const updated = await prisma.form.update({
      where: { id: formId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      OR: [
        { creatorId: session.user.id },
        {
          workflow: {
            workspace: {
              members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
            },
          },
        },
      ],
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  await prisma.form.delete({ where: { id: formId } });

  return NextResponse.json({ data: { success: true } });
}
