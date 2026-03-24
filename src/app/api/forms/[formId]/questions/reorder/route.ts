import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { reorderQuestionsSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function POST(
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
    return NextResponse.json({ error: "Formulario nao encontrado" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { questionIds } = reorderQuestionsSchema.parse(body);

    await prisma.$transaction(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
}
