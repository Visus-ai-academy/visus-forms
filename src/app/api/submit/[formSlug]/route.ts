import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { buildDynamicSchema } from "@/lib/services/form-validator";
import { dispatchWebhooks } from "@/lib/services/webhook-dispatcher";

/**
 * Schema Zod para validar o body inteiro da submissão.
 * Campos respondent, metadata e startedAt não devem usar type assertion.
 */
const submitBodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  startedAt: z.string().datetime().optional(),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .refine(
      (val) => !val || JSON.stringify(val).length < 10000,
      "Metadata excede o tamanho máximo permitido"
    ),
  respondent: z
    .object({
      name: z.string().max(200).trim().optional(),
      email: z.string().email().optional(),
      cpf: z
        .string()
        .regex(
          /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
          "CPF em formato inválido"
        )
        .optional(),
      phone: z.string().max(20).trim().optional(),
    })
    .optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formSlug: string }> }
) {
  const { formSlug } = await params;

  const form = await prisma.form.findFirst({
    where: {
      slug: formSlug,
      status: "PUBLISHED",
    },
    include: {
      settings: true,
      theme: true,
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
          conditionalRules: true,
          layouts: true,
        },
      },
    },
  });

  if (!form) {
    return NextResponse.json(
      { error: "Formulário não encontrado ou não publicado" },
      { status: 404 }
    );
  }

  // Verificar limite de respostas
  if (form.settings?.limitResponses) {
    const count = await prisma.formResponse.count({
      where: { formId: form.id, status: "COMPLETED" },
    });
    if (count >= form.settings.limitResponses) {
      return NextResponse.json(
        { error: "Este formulário atingiu o limite de respostas" },
        { status: 410 }
      );
    }
  }

  // Verificar agendamento
  const now = new Date();
  if (form.settings?.scheduledOpenAt && new Date(form.settings.scheduledOpenAt) > now) {
    return NextResponse.json(
      { error: "Este formulário ainda não está disponível" },
      { status: 403 }
    );
  }
  if (form.settings?.scheduledCloseAt && new Date(form.settings.scheduledCloseAt) < now) {
    return NextResponse.json(
      { error: "Este formulário ja foi encerrado" },
      { status: 410 }
    );
  }

  return NextResponse.json({ data: form });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ formSlug: string }> }
) {
  const { formSlug } = await params;

  const form = await prisma.form.findFirst({
    where: {
      slug: formSlug,
      status: "PUBLISHED",
    },
    include: {
      settings: true,
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
          conditionalRules: true,
          layouts: true,
        },
      },
    },
  });

  if (!form) {
    return NextResponse.json(
      { error: "Formulário não encontrado ou não publicado" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();

    // Validar body inteiro com Zod (não confiar em type assertion)
    const bodyValidation = submitBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: bodyValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { answers, startedAt, metadata, respondent } = bodyValidation.data;

    // Validacao server-side
    const schema = buildDynamicSchema(form.questions);
    const validated = schema.safeParse(answers);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Calcular duracao
    const now = new Date();
    const duration = startedAt
      ? Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000)
      : null;

    // Criar resposta + answers em transacao
    const responseData: Record<string, unknown> = {
      formId: form.id,
      status: "COMPLETED",
      completedAt: now,
      duration,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      respondentName: respondent?.name || null,
      respondentEmail: respondent?.email || null,
      respondentCpf: respondent?.cpf || null,
      respondentPhone: respondent?.phone || null,
      answers: {
        create: form.questions
          .filter((q) => validated.data[q.id] !== undefined && validated.data[q.id] !== null && validated.data[q.id] !== "")
          .map((q) => {
            const val = validated.data[q.id];
            return {
              questionId: q.id,
              ...mapValueToAnswer(q.type, val),
            } satisfies Prisma.AnswerUncheckedCreateWithoutFormResponseInput;
          }),
      },
    };

    const response = await (prisma.formResponse.create as Function)({
      data: responseData,
      include: { answers: true },
    });

    // Criar registros FileUpload para perguntas do tipo FILE_UPLOAD
    const fileUploadQuestions = form.questions.filter((q) => q.type === "FILE_UPLOAD");
    for (const q of fileUploadQuestions) {
      const files = validated.data[q.id] as { url: string; storagePath: string; originalName: string; mimeType: string; sizeBytes: number }[] | undefined;
      if (!files || !Array.isArray(files) || files.length === 0) continue;

      const answer = response.answers.find((a: { questionId: string }) => a.questionId === q.id);
      if (!answer) continue;

      await (prisma.fileUpload as any).create({
        data: {
          answerId: answer.id,
          originalName: files[0].originalName,
          storagePath: files[0].storagePath,
          storageUrl: files[0].url,
          mimeType: files[0].mimeType,
          sizeBytes: files[0].sizeBytes,
        },
      });
    }

    // Disparar webhooks (fire-and-forget)
    dispatchWebhooks({
      formId: form.id,
      formTitle: form.title,
      responseId: response.id,
      answers: validated.data,
      questions: form.questions.map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type,
      })),
      respondent: respondent ?? undefined,
    }).catch(() => {});

    return NextResponse.json({ data: { responseId: response.id } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao processar submissao" }, { status: 500 });
  }
}

function mapValueToAnswer(
  type: string,
  value: unknown
) {
  switch (type) {
    case "NUMBER":
    case "RATING":
      return { numberValue: Number(value) };
    case "YES_NO":
      return { booleanValue: value === true || value === "sim" };
    case "DATE":
      return { dateValue: value ? new Date(String(value)) : null };
    case "MULTIPLE_CHOICE":
    case "FILE_UPLOAD":
    case "ADDRESS":
      return { jsonValue: value as Prisma.InputJsonValue };
    default:
      return { textValue: String(value ?? "") };
  }
}
