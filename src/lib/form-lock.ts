import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Verifica se o formulario esta bloqueado para edicao/exclusao de perguntas.
 * Um formulario esta bloqueado se estiver publicado OU tiver respostas.
 * Retorna null se nao esta bloqueado, ou uma Response de erro se esta.
 */
export async function checkFormLocked(formId: string): Promise<NextResponse | null> {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      status: true,
      _count: { select: { responses: true } },
    },
  });

  if (!form) return null;

  if (form.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Formulário publicado. Despublique antes de editar perguntas." },
      { status: 403 }
    );
  }

  if (form._count.responses > 0) {
    return NextResponse.json(
      { error: "Formulário possui respostas. Não é possível editar perguntas." },
      { status: 403 }
    );
  }

  return null;
}
