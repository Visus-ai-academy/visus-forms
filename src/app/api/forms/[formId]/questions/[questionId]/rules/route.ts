import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { conditionalRuleSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string; questionId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { questionId } = await params;

  const rules = await prisma.conditionalRule.findMany({
    where: {
      sourceQuestionId: questionId,
      sourceQuestion: {
        form: {
          workflow: {
            workspace: { members: { some: { userId: session.user.id } } },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data: rules });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ formId: string; questionId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId, questionId } = await params;

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      formId,
      form: {
        workflow: {
          workspace: {
            members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } } },
          },
        },
      },
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = conditionalRuleSchema.parse(body);

    const maxOrder = await prisma.conditionalRule.findFirst({
      where: { sourceQuestionId: questionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const rule = await prisma.conditionalRule.create({
      data: {
        sourceQuestionId: questionId,
        operator: data.operator,
        value: data.value,
        action: data.action,
        targetQuestionId: data.targetQuestionId,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ data: rule }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
