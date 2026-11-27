import { deliverySoloMaqueta } from "@/lib/delivery/config";
import { destinoSeguro } from "@/lib/rutas-protegidas";
import {
  ROL_ADMINISTRADOR,
  ROL_CLIENTE,
  ROL_MESERO,
  ROL_REPARTIDOR,
  rutaInicioPorRol,
  type RolPerfil,
} from "@/lib/roles";

const PREFIJOS_CLIENTE = ["/delivery"];
const PREFIJOS_MESERO = ["/pedidos", "/admin/delivery"];
const PREFIJOS_REPARTIDOR = ["/repartidor"];
const PREFIJOS_ADMIN = [
  "/",
  "/catalogos",
  "/inventario",
  "/combos",
  "/recetas",
  "/admin/delivery",
];

const RUTAS_BLOQUEADAS_ADMIN = ["/pedidos", "/ventas", "/delivery", "/repartidor"];

const PREFIJOS_DELIVERY_MAQUETA = ["/delivery", "/admin/delivery", "/repartidor"];

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

  if (
    deliverySoloMaqueta() &&
    PREFIJOS_DELIVERY_MAQUETA.some((p) => coincidePrefijo(pathname, p))
  ) {
    return true;
  }

  if (rol === ROL_CLIENTE) {
    return PREFIJOS_CLIENTE.some((p) => coincidePrefijo(pathname, p));
  }

  if (rol === ROL_REPARTIDOR) {
    return PREFIJOS_REPARTIDOR.some((p) => coincidePrefijo(pathname, p));
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
  if (pathname !== "/") {
    return false;
  }
  return (
    rol === ROL_MESERO ||
    rol === ROL_CLIENTE ||
    rol === ROL_REPARTIDOR
  );
}