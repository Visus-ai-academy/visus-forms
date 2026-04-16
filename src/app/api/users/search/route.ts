import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ data: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      email: { contains: q, mode: "insensitive" },
      id: { not: session.user.id },
    },
    select: { id: true, name: true, email: true },
    take: 5,
  });

  return NextResponse.json({ data: users });
}
