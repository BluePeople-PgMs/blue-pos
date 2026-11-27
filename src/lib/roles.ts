import type { SupabaseClient } from "@supabase/supabase-js";

export const ROL_CLIENTE = "cliente" as const;
export const ROL_MESERO = "mesero" as const;
export const ROL_ADMINISTRADOR = "administrador" as const;
export const ROL_REPARTIDOR = "repartidor" as const;

export const ROLES_PERFIL = [
  ROL_CLIENTE,
  ROL_MESERO,
  ROL_ADMINISTRADOR,
  ROL_REPARTIDOR,
] as const;

export const ROLES_REGISTRO = [ROL_CLIENTE, ROL_MESERO, ROL_REPARTIDOR] as const;

export type RolPerfil = (typeof ROLES_PERFIL)[number];
export type RolRegistro = (typeof ROLES_REGISTRO)[number];

export function esRolPerfil(valor: string): valor is RolPerfil {
  return (ROLES_PERFIL as readonly string[]).includes(valor);
}

export function esRolRegistro(valor: string): valor is RolRegistro {
  return (ROLES_REGISTRO as readonly string[]).includes(valor);
}

export function rutaInicioPorRol(rol: RolPerfil): string {
  switch (rol) {
    case ROL_CLIENTE:
      return "/delivery";
    case ROL_REPARTIDOR:
      return "/repartidor/delivery";
    case ROL_MESERO:
      return "/pedidos";
    case ROL_ADMINISTRADOR:
      return "/";
    default:
      return "/delivery";
  }
}

export async function obtenerRolPerfil(
  supabase: SupabaseClient,
  userId: string,
): Promise<RolPerfil> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.rol || !esRolPerfil(data.rol)) {
    return ROL_CLIENTE;
  }
  return data.rol;
}

export function etiquetaRol(rol: RolPerfil): string {
  switch (rol) {
    case ROL_CLIENTE:
      return "Cliente";
    case ROL_REPARTIDOR:
      return "Repartidor";
    case ROL_ADMINISTRADOR:
      return "Administrador";
    case ROL_MESERO:
      return "Mesero";
    default:
      return rol;
  }
}

export function etiquetaRolRegistro(rol: RolRegistro): string {
  switch (rol) {
    case ROL_CLIENTE:
      return "Cliente (pedidos a domicilio)";
    case ROL_MESERO:
      return "Mesero (punto de venta y empaque)";
    case ROL_REPARTIDOR:
      return "Repartidor (entregas)";
    default:
      return rol;
  }
}