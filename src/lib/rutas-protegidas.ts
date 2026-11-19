/** Acepta solo rutas internas relativas (evita open redirect). */
export function destinoSeguro(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}