import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getClientIp, RateLimiter } from "@/lib/rate-limit";

// Rate limiter: 5 registros por hora por IP
const registerRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve ter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve ter pelo menos um número"),
});

export async function POST(request: Request) {
  // Rate limiting por IP
  const clientIp = getClientIp(request);
  const { allowed, retryAfterMs } = registerRateLimiter.check(clientIp);

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de registro. Tente novamente mais tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Retorna resposta genérica idêntica ao sucesso para prevenir enumeração de emails
      return NextResponse.json(
        { message: "Se este email estiver disponível, a conta será criada. Verifique seu email." },
        { status: 201 }
      );
    }

    const passwordHash = await hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return NextResponse.json(
      { message: "Se este email estiver disponível, a conta será criada. Verifique seu email." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
