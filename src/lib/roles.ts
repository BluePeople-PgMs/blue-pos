import type { SupabaseClient } from "@supabase/supabase-js";

export const ROL_MESERO = "mesero" as const;
export const ROL_ADMINISTRADOR = "administrador" as const;

export const ROLES_PERFIL = [ROL_MESERO, ROL_ADMINISTRADOR] as const;

export type RolPerfil = (typeof ROLES_PERFIL)[number];

export function esRolPerfil(valor: string): valor is RolPerfil {
  return (ROLES_PERFIL as readonly string[]).includes(valor);
}

export function rutaInicioPorRol(rol: RolPerfil): string {
  return rol === ROL_MESERO ? "/pedidos" : "/";
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
    return ROL_MESERO;
  }
  return data.rol;
}

export function etiquetaRol(rol: RolPerfil): string {
  return rol === ROL_ADMINISTRADOR ? "Administrador" : "Mesero";
}