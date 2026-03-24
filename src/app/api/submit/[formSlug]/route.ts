import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { buildDynamicSchema } from "@/lib/services/form-validator";

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
    const { answers, startedAt, metadata, respondent } = body as {
      answers: Record<string, unknown>;
      startedAt?: string;
      metadata?: Record<string, unknown>;
      respondent?: {
        name?: string;
        email?: string;
        cpf?: string;
        phone?: string;
      };
    };

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
      return { jsonValue: value as Prisma.InputJsonValue };
    default:
      return { textValue: String(value ?? "") };
  }
}
