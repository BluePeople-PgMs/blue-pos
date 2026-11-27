export type RolSistema = "cajero" | "administrador";

export const ROL_PREDETERMINADO: RolSistema = "cajero";

export function etiquetaRol(rol: RolSistema) {
  if (rol === "administrador") return "Administrador";
  return "Cajero";
}

export function esRolSistema(valor: string): valor is RolSistema {
  return valor === "cajero" || valor === "administrador";
}

/** Rutas que cualquier rol con sesión puede abrir. */
const RUTAS_CAJERO = new Set([
  "/",
  "/login",
  "/ventas",
  "/catalogos",
  "/catalogos/comidas",
  "/catalogos/productos",
]);

export function rutaPermitida(rol: RolSistema, pathname: string) {
  if (pathname.startsWith("/delivery") && !pathname.startsWith("/delivery/cocina")) {
    return true;
  }
  if (rol === "administrador") return true;
  if (RUTAS_CAJERO.has(pathname)) return true;
  if (pathname.startsWith("/delivery/cocina")) return true;
  return pathname.startsWith("/catalogos/");
}

export function menuVisibleParaRol(
  rol: RolSistema,
  rolesPermitidos: RolSistema[] | undefined,
) {
  if (!rolesPermitidos || rolesPermitidos.length === 0) return true;
  return rolesPermitidos.includes(rol);
}