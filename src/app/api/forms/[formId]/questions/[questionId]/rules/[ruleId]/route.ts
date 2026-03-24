import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { conditionalRuleSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string; questionId: string; ruleId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { ruleId } = await params;

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

  const { ruleId } = await params;

  await prisma.conditionalRule.delete({ where: { id: ruleId } });

  return NextResponse.json({ data: { success: true } });
}
