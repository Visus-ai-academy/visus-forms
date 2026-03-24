import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      workflow: {
        workspace: {
          members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } } },
        },
      },
    },
    include: { _count: { select: { questions: true } } },
  });

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  if (form._count.questions === 0) {
    return NextResponse.json({ error: "Adicione pelo menos uma pergunta antes de publicar" }, { status: 400 });
  }

  const updated = await prisma.form.update({
    where: { id: formId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({ data: updated });
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
      workflow: {
        workspace: {
          members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } } },
        },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  const updated = await prisma.form.update({
    where: { id: formId },
    data: {
      status: "DRAFT",
      publishedAt: null,
    },
  });

  return NextResponse.json({ data: updated });
}
