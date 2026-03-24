import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Nao autorizado" }, { status: 401 }) };
  }

  return { session, error: null };
}
