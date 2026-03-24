import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

const layoutItemSchema = z.object({
  questionId: z.string(),
  breakpoint: z.enum(["desktop", "mobile"]),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
});

const saveLayoutsSchema = z.object({
  layouts: z.array(layoutItemSchema),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const layouts = await prisma.questionLayout.findMany({
    where: {
      question: {
        formId,
        form: {
          workflow: {
            workspace: { members: { some: { userId: session.user.id } } },
          },
        },
      },
    },
    orderBy: { y: "asc" },
  });

  return NextResponse.json({ data: layouts });
}

export async function PUT(
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
    const { layouts } = saveLayoutsSchema.parse(body);

    // Upsert em transacao
    await prisma.$transaction(
      layouts.map((layout) =>
        prisma.questionLayout.upsert({
          where: {
            questionId_breakpoint: {
              questionId: layout.questionId,
              breakpoint: layout.breakpoint,
            },
          },
          create: {
            questionId: layout.questionId,
            breakpoint: layout.breakpoint,
            x: layout.x,
            y: layout.y,
            w: layout.w,
            h: layout.h,
          },
          update: {
            x: layout.x,
            y: layout.y,
            w: layout.w,
            h: layout.h,
          },
        })
      )
    );

    const updated = await prisma.questionLayout.findMany({
      where: {
        question: { formId },
      },
      orderBy: { y: "asc" },
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
