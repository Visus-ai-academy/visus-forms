import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createWebhookSchema } from "@/lib/schemas/webhook";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;

  const webhooks = await prisma.formWebhook.findMany({
    where: {
      formId,
      form: {
        OR: [
          { creatorId: session.user.id },
          {
            workflow: {
              workspace: { members: { some: { userId: session.user.id } } },
            },
          },
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: webhooks });
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
      OR: [
        { creatorId: session.user.id },
        {
          workflow: {
            workspace: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER", "ADMIN", "MEMBER"] },
                },
              },
            },
          },
        },
      ],
    },
  });

  if (!form) {
    return NextResponse.json(
      { error: "Formulário não encontrado" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    const webhook = await prisma.formWebhook.create({
      data: {
        formId,
        name: data.name,
        url: data.url,
        method: data.method,
        headers: data.headers,
        enabled: data.enabled,
        questionIds: data.questionIds,
        secret: data.secret ?? null,
        retryCount: data.retryCount,
      },
    });

    return NextResponse.json({ data: webhook }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
