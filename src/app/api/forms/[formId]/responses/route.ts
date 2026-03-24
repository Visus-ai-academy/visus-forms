import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId } = await params;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const status = url.searchParams.get("status");

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      workflow: {
        workspace: { members: { some: { userId: session.user.id } } },
      },
    },
    select: { id: true },
  });

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  const where = {
    formId,
    ...(status ? { status: status as "IN_PROGRESS" | "COMPLETED" | "ABANDONED" } : {}),
  };

  const [responses, total] = await Promise.all([
    prisma.formResponse.findMany({
      where,
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                type: true,
                order: true,
                options: { orderBy: { order: "asc" }, select: { value: true, label: true } },
              },
            },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.formResponse.count({ where }),
  ]);

  const stats = await prisma.formResponse.aggregate({
    where: { formId },
    _count: true,
    _avg: { duration: true },
  });

  const completedCount = await prisma.formResponse.count({
    where: { formId, status: "COMPLETED" },
  });

  return NextResponse.json({
    data: responses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      total: stats._count,
      completed: completedCount,
      completionRate: stats._count > 0 ? Math.round((completedCount / stats._count) * 100) : 0,
      avgDuration: Math.round(stats._avg.duration ?? 0),
    },
  });
}
