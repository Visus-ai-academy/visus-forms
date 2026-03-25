import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import Papa from "papaparse";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

/**
 * Sanitiza o título do formulário para uso seguro no header Content-Disposition.
 * Remove caracteres especiais, substitui espaços por underscore e limita a 50 chars.
 */
function sanitizeFilename(title: string): string {
  const sanitized = title
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
  return sanitized || "formulario";
}

function getAnswerDisplay(
  answer: {
    textValue: string | null;
    numberValue: number | null;
    booleanValue: boolean | null;
    dateValue: Date | null;
    jsonValue: unknown;
    fileUpload?: { originalName: string; storageUrl: string } | null;
  },
  optionsMap?: Map<string, string>
): string {
  if (answer.fileUpload) {
    return answer.fileUpload.storageUrl;
  }
  if (answer.textValue !== null) {
    if (optionsMap?.has(answer.textValue)) return optionsMap.get(answer.textValue)!;
    return answer.textValue;
  }
  if (answer.numberValue !== null) return String(answer.numberValue);
  if (answer.booleanValue !== null) return answer.booleanValue ? "Sim" : "Nao";
  if (answer.dateValue !== null) return new Date(answer.dateValue).toLocaleDateString("pt-BR");
  if (answer.jsonValue !== null) {
    if (Array.isArray(answer.jsonValue)) {
      if (optionsMap) {
        return (answer.jsonValue as string[]).map((v) => optionsMap.get(v) || v).join(", ");
      }
      return (answer.jsonValue as string[]).join(", ");
    }
    return JSON.stringify(answer.jsonValue);
  }
  return "";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv";

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      workflow: {
        workspace: { members: { some: { userId: session.user.id } } },
      },
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          options: { orderBy: { order: "asc" }, select: { value: true, label: true } },
        },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  const responses = await prisma.formResponse.findMany({
    where: { formId, status: "COMPLETED" },
    include: {
      answers: { include: { fileUpload: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  // Montar linhas
  const headers = [
    "ID",
    "Respondente",
    "E-mail",
    "CPF",
    "Telefone",
    "Status",
    "Data de envio",
    "Duração (s)",
    ...form.questions.map((q) => q.title),
  ];

  // Construir mapa de opções por pergunta
  const questionOptionsMaps = new Map<string, Map<string, string>>();
  for (const q of form.questions) {
    if (q.options && q.options.length > 0) {
      questionOptionsMaps.set(q.id, new Map(q.options.map((o) => [o.value, o.label])));
    }
  }

  const rows = responses.map((response) => {
    const r = response as Record<string, unknown>;
    const answerMap = new Map(response.answers.map((a) => [a.questionId, a]));
    return [
      response.id,
      (r.respondentName as string) || response.user?.name || "Anônimo",
      (r.respondentEmail as string) || response.user?.email || "-",
      (r.respondentCpf as string) || "-",
      (r.respondentPhone as string) || "-",
      response.status,
      response.completedAt
        ? new Date(response.completedAt).toLocaleString("pt-BR")
        : "-",
      response.duration ? String(response.duration) : "-",
      ...form.questions.map((q) => {
        const answer = answerMap.get(q.id);
        return answer ? getAnswerDisplay(answer, questionOptionsMaps.get(q.id)) : "";
      }),
    ];
  });

  const safeFilename = sanitizeFilename(form.title);

  if (format === "csv") {
    const csv = Papa.unparse({ fields: headers, data: rows });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeFilename}-respostas.csv"; filename*=UTF-8''${encodeURIComponent(safeFilename)}-respostas.csv`,
      },
    });
  }

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Respostas");

    // Header
    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6366F1" },
    };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Dados
    for (const row of rows) {
      sheet.addRow(row);
    }

    // Auto-width
    for (const column of sheet.columns) {
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLength) maxLength = Math.min(len, 50);
      });
      column.width = maxLength + 2;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeFilename}-respostas.xlsx"; filename*=UTF-8''${encodeURIComponent(safeFilename)}-respostas.xlsx`,
      },
    });
  }

  return NextResponse.json({ error: "Formato não suportado. Use csv ou xlsx." }, { status: 400 });
}
