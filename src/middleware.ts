import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de auth
  const publicPaths = ["/login", "/register", "/api/auth", "/f/"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  // Rotas de API públicas (submit é público para respondentes)
  const publicApiPaths = ["/api/auth", "/api/submit/"];
  const isPublicApi = publicApiPaths.some((path) => pathname.startsWith(path));

  // Proteger rotas /api/* que não são públicas
  if (pathname.startsWith("/api/") && !isPublicApi && !token) {
    return NextResponse.json(
      { error: "Nao autorizado" },
      { status: 401 }
    );
  }

  if (isPublic) {
    // Se logado e tentando acessar login/register, redireciona pro dashboard
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Rotas protegidas - redireciona pro login se não autenticado
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/api/:path*"],
};
