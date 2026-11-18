/** Prefijos de ruta que exigen sesión iniciada. */
export const RUTAS_PROTEGIDAS = ["/inventario", "/ventas"] as const;

export function esRutaProtegida(pathname: string): boolean {
  return RUTAS_PROTEGIDAS.some(
    (prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  );
}

/** Acepta solo rutas internas relativas (evita open redirect). */
export function destinoSeguro(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}