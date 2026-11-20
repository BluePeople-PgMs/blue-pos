import { destinoSeguro } from "@/lib/rutas-protegidas";
import { ROL_MESERO, rutaInicioPorRol, type RolPerfil } from "@/lib/roles";

const PREFIJOS_MESERO = ["/pedidos"];

const PREFIJOS_ADMIN = [
  "/",
  "/catalogos",
  "/inventario",
  "/combos",
  "/recetas",
];

const RUTAS_BLOQUEADAS_ADMIN = ["/pedidos", "/ventas"];

function coincidePrefijo(pathname: string, prefijo: string): boolean {
  if (prefijo === "/") {
    return pathname === "/";
  }
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

export function rutaPermitidaParaRol(rol: RolPerfil, pathname: string): boolean {
  if (pathname === "/login") {
    return true;
  }

  if (rol === ROL_MESERO) {
    return PREFIJOS_MESERO.some((p) => coincidePrefijo(pathname, p));
  }

  if (RUTAS_BLOQUEADAS_ADMIN.some((p) => coincidePrefijo(pathname, p))) {
    return false;
  }

  return PREFIJOS_ADMIN.some((p) => coincidePrefijo(pathname, p));
}

export function destinoSeguroParaRol(
  next: string | null | undefined,
  rol: RolPerfil,
): string {
  const seguro = destinoSeguro(next);
  if (seguro && rutaPermitidaParaRol(rol, seguro)) {
    return seguro;
  }
  return rutaInicioPorRol(rol);
}

export function debeRedirigirDesdeInicio(
  rol: RolPerfil,
  pathname: string,
): boolean {
  return rol === ROL_MESERO && pathname === "/";
}