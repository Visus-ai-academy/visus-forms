import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createFormSchema } from "@/lib/schemas/form";
import { getRequiredSession } from "@/lib/session";
import { generateSlug } from "@/lib/utils/slug";

export async function GET(request: Request) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("workflowId");

  const forms = await prisma.form.findMany({
    where: {
      creatorId: session.user.id,
      ...(workflowId ? { workflowId } : {}),
    },
    include: {
      workflow: { select: { id: true, name: true } },
      _count: { select: { questions: true, responses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: forms });
}

export async function POST(request: Request) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  try {
    const body = await request.json();
    const data = createFormSchema.parse(body);

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: data.workflowId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ["OWNER", "ADMIN", "MEMBER"] },
            },
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    const form = await prisma.form.create({
      data: {
        title: data.title,
        description: data.description,
        slug: generateSlug(data.title),
        workflowId: data.workflowId,
        creatorId: session.user.id,
        settings: {
          create: {},
        },
        theme: {
          create: {},
        },
      },
    });

    return NextResponse.json({ data: form }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
