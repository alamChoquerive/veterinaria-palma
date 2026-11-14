import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy de Next.js 16 (antes llamado "middleware").
 *
 * Hace un chequeo OPTIMISTA de sesión: si no hay cookie de sesión de
 * Supabase, manda a /login. La autorización real por rol (admin vs cliente)
 * vive en app/(admin)/layout.tsx y dentro de cada Server Action, porque el
 * proxy no es un boundary de seguridad (ver guía "data-security" de Next 16).
 *
 * Además aplica headers de seguridad a TODAS las respuestas (sin matcher
 * restrictivo): X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy,
 * CSP y HSTS en producción.
 */

const esProduccion = process.env.NODE_ENV === "production";

function origenSupabase(): { https: string; wss: string } {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return { https: url.origin, wss: `wss://${url.host}` };
  } catch {
    return { https: "https://*.supabase.co", wss: "wss://*.supabase.co" };
  }
}

function construirCSP(): string {
  const supa = origenSupabase();
  // 'unsafe-inline' en script-src es necesario porque el App Router inyecta
  // scripts inline (self.__next_f.push). En dev se suma 'unsafe-eval' (HMR).
  const scriptSrc = esProduccion
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supa.https} ${supa.wss}`,
    "frame-src 'self' https://www.mercadopago.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function aplicarHeadersSeguridad(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("Content-Security-Policy", construirCSP());
  if (esProduccion) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains",
    );
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // @supabase/ssr guarda la sesión en cookies "sb-<project-ref>-auth-token"
  // (puede venir splitteada en .0, .1, ...)
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/cuenta");

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return aplicarHeadersSeguridad(NextResponse.redirect(url));
  }

  // OJO: no se redirige /login o /registro cuando ya hay cookie de sesión.
  // El chequeo de arriba es solo "existe la cookie", y una cookie vencida o
  // de un usuario borrado haría que /login rebotara a / (pareciendo que el
  // botón de login "no hace nada"). La sesión real se valida en el layout /
  // en las Server Actions con getUser(); además permitir /login con sesión
  // sirve para cambiar de usuario en las pruebas.
  return aplicarHeadersSeguridad(NextResponse.next());
}
