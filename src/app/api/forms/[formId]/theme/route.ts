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
        workflow: {
          workspace: { members: { some: { userId: session.user.id } } },
        },
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
    const message = err instanceof Error ? err.message : "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
