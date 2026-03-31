import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { formThemeSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const theme = await prisma.formTheme.findFirst({
    where: {
      formId,
      form: {
        OR: [
          { creatorId: session.user.id },
          {
            workflow: {
              workspace: { members: { some: { userId: session.user.id } } },
            },
          },
        ],
      },
    },
  });

  if (!theme) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: theme });
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
    const data = formThemeSchema.parse(body);

    const updated = await prisma.formTheme.update({
      where: { formId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("Theme update error:", err);
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
