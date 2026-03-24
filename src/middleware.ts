import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Rotas publicas que nao precisam de auth
  const publicPaths = ["/login", "/register", "/api/auth", "/f/"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublic) {
    // Se logado e tentando acessar login/register, redireciona pro dashboard
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Rotas protegidas - redireciona pro login se nao autenticado
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
