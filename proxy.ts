import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy de Next.js 16 (antes llamado "middleware").
 *
 * Hace un chequeo OPTIMISTA de sesión: si no hay cookie de sesión de
 * Supabase, manda a /login. La autorización real por rol (admin vs cliente)
 * vive en app/(admin)/layout.tsx y dentro de cada Server Action, porque el
 * proxy no es un boundary de seguridad (ver guía "data-security" de Next 16).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // @supabase/ssr guarda la sesión en cookies "sb-<project-ref>-auth-token"
  // (puede venir splitteada en .0, .1, ...)
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/cuenta");
  const isAuthPage = pathname === "/login" || pathname === "/registro";

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/login", "/registro"],
};
