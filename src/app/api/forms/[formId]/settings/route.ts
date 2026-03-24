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
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
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

  try {
    const body = await request.json();
    const data = formSettingsSchema.parse(body);

    const updated = await prisma.formSettings.update({
      where: { formId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
}
