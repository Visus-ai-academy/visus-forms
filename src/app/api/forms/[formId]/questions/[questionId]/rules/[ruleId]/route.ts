import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { conditionalRuleSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

async function verifyRuleOwnership(
  ruleId: string,
  questionId: string,
  formId: string,
  userId: string
) {
  return prisma.conditionalRule.findFirst({
    where: {
      id: ruleId,
      sourceQuestionId: questionId,
      sourceQuestion: {
        formId,
        form: {
          workflow: {
            workspace: {
              members: {
                some: {
                  userId,
                  role: { in: ["OWNER", "ADMIN", "MEMBER"] },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string; questionId: string; ruleId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId, questionId, ruleId } = await params;

  const rule = await verifyRuleOwnership(ruleId, questionId, formId, session.user.id);
  if (!rule) {
    return NextResponse.json({ error: "Regra nao encontrada" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = conditionalRuleSchema.partial().parse(body);

    const updated = await prisma.conditionalRule.update({
      where: { id: ruleId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ formId: string; questionId: string; ruleId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId, questionId, ruleId } = await params;

  const rule = await verifyRuleOwnership(ruleId, questionId, formId, session.user.id);
  if (!rule) {
    return NextResponse.json({ error: "Regra nao encontrada" }, { status: 404 });
  }

  await prisma.conditionalRule.delete({ where: { id: ruleId } });

  return NextResponse.json({ data: { success: true } });
}
