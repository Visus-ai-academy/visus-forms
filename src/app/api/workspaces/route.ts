import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createWorkspaceSchema } from "@/lib/schemas/workspace";
import { getRequiredSession } from "@/lib/session";
import { generateSlug } from "@/lib/utils/slug";

export async function GET() {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      _count: { select: { workflows: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: workspaces });
}

export async function POST(request: Request) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  try {
    const body = await request.json();
    const data = createWorkspaceSchema.parse(body);

    const workspace = await prisma.workspace.create({
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
