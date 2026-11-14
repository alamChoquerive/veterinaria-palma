/**
 * Valida que un destino de redirección sea una ruta INTERNA de la app.
 *
 * Cierra open redirects: bloquea URLs externas (https://evil.com),
 * protocol-relative (//evil.com) y el trick con backslash (/\evil.com).
 * Los esquemas tipo "javascript:" o "https:" no empiezan con "/" y
 * también quedan fuera.
 */
export function esRedirectInterno(
  dest: string | null | undefined,
): dest is string {
  if (!dest) return false;
  if (!dest.startsWith("/")) return false;
  if (dest.startsWith("//")) return false;
  if (dest.includes("\\")) return false;
  return true;
}
