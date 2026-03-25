import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { formSettingsSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const settings = await prisma.formSettings.findFirst({
    where: {
      formId,
      form: {
        workflow: {
          workspace: { members: { some: { userId: session.user.id } } },
        },
      },
    },
  });

  if (!settings) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: settings });
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

  try {
    const body = await request.json();
    const data = formSettingsSchema.parse(body);

    const updated = await (prisma.formSettings.update as Function)({
      where: { formId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
