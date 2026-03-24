import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createQuestionSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const questions = await prisma.question.findMany({
    where: {
      formId,
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
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data: questions });
}

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
    const data = createQuestionSchema.parse(body);

    const maxOrder = await prisma.question.findFirst({
      where: { formId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const question = await prisma.question.create({
      data: {
        formId,
        type: data.type,
        title: data.title,
        description: data.description,
        placeholder: data.placeholder,
        required: data.required,
        config: data.config as Prisma.InputJsonValue,
        order: (maxOrder?.order ?? -1) + 1,
        options: data.options
          ? {
              create: data.options.map((opt, idx) => ({
                label: opt.label,
                value: opt.value,
                imageUrl: opt.imageUrl,
                order: idx,
              })),
            }
          : undefined,
      },
      include: {
        options: { orderBy: { order: "asc" } },
        conditionalRules: true,
        layouts: true,
      },
    });

    return NextResponse.json({ data: question }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
}
