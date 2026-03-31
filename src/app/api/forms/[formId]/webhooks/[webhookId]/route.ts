import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateWebhookSchema } from "@/lib/schemas/webhook";
import { getRequiredSession } from "@/lib/session";

async function findWebhookWithAuth(
  webhookId: string,
  formId: string,
  userId: string
) {
  return prisma.formWebhook.findFirst({
    where: {
      id: webhookId,
      formId,
      form: {
        OR: [
          { creatorId: userId },
          {
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
        ],
      },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string; webhookId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId, webhookId } = await params;

  const existing = await findWebhookWithAuth(
    webhookId,
    formId,
    session.user.id
  );

  if (!existing) {
    return NextResponse.json(
      { error: "Webhook não encontrado" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const data = updateWebhookSchema.parse(body);

    const webhook = await prisma.formWebhook.update({
      where: { id: webhookId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.method !== undefined && { method: data.method }),
        ...(data.headers !== undefined && { headers: data.headers }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.questionIds !== undefined && {
          questionIds: data.questionIds,
        }),
        ...(data.secret !== undefined && { secret: data.secret ?? null }),
        ...(data.retryCount !== undefined && { retryCount: data.retryCount }),
      },
    });

    return NextResponse.json({ data: webhook });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ formId: string; webhookId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId, webhookId } = await params;

  const existing = await findWebhookWithAuth(
    webhookId,
    formId,
    session.user.id
  );

  if (!existing) {
    return NextResponse.json(
      { error: "Webhook não encontrado" },
      { status: 404 }
    );
  }

  await prisma.formWebhook.delete({ where: { id: webhookId } });

  return NextResponse.json({ data: { success: true } });
}
