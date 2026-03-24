import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { checkFormLocked } from "@/lib/form-lock";
import { prisma } from "@/lib/prisma";
import { updateQuestionSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string; questionId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { questionId } = await params;

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      form: {
        workflow: {
          workspace: { members: { some: { userId: session.user.id } } },
        },
      },
    },
    include: {
      options: { orderBy: { order: "asc" } },
      conditionalRules: true,
      layouts: true,
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ data: question });
}

export async function PATCH(
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

  const locked = await checkFormLocked(formId);
  if (locked) return locked;

  try {
    const body = await request.json();
    const data = updateQuestionSchema.parse(body);

    const { options, config, ...rest } = data;

    const questionData = {
      ...rest,
      ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}),
    };

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: questionData,
      include: {
        options: { orderBy: { order: "asc" } },
      },
    });

    if (options !== undefined) {
      await prisma.questionOption.deleteMany({ where: { questionId } });
      if (options.length > 0) {
        await prisma.questionOption.createMany({
          data: options.map((opt, idx) => ({
            questionId,
            label: opt.label,
            value: opt.value,
            imageUrl: opt.imageUrl,
            order: idx,
          })),
        });
      }

      const withOptions = await prisma.question.findUnique({
        where: { id: questionId },
        include: { options: { orderBy: { order: "asc" } } },
      });

      return NextResponse.json({ data: withOptions });
    }

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
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
            members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
          },
        },
      },
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }

  const lockedDel = await checkFormLocked(formId);
  if (lockedDel) return lockedDel;

  await prisma.question.delete({ where: { id: questionId } });

  return NextResponse.json({ data: { success: true } });
}
