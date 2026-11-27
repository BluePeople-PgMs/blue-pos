import { deliverySoloMaqueta } from "@/lib/delivery/config";
import type { SupabaseClient, User } from "@supabase/supabase-js";

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

export function rolDesdeMetadataRegistro(user: User): RolPerfil | null {
  const raw = user.user_metadata?.rol_registro;
  if (typeof raw !== "string") {
    return null;
  }
  const valor = raw.toLowerCase().trim();
  return esRolRegistro(valor) ? valor : null;
}

/** Capacitación: correos QA con la palabra cliente/repartidor/mesero en el alias. */
export function rolDesdeEmailCapacitacion(
  email: string | undefined,
): RolPerfil | null {
  if (!email || !deliverySoloMaqueta()) {
    return null;
  }
  const e = email.toLowerCase();
  if (e.includes("cliente")) {
    return ROL_CLIENTE;
  }
  if (e.includes("repartidor")) {
    return ROL_REPARTIDOR;
  }
  if (e.includes("mesero")) {
    return ROL_MESERO;
  }
  return null;
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

/**
 * Rol efectivo para sesión: en maqueta prioriza lo elegido al registrarse
 * (metadata / alias del correo) porque el trigger antiguo de Supabase deja
 * muchas cuentas como mesero.
 */
export async function obtenerRolEfectivo(
  supabase: SupabaseClient,
  user: User,
): Promise<RolPerfil> {
  if (deliverySoloMaqueta()) {
    const meta = rolDesdeMetadataRegistro(user);
    if (meta) {
      return meta;
    }
    const porEmail = rolDesdeEmailCapacitacion(user.email);
    if (porEmail) {
      return porEmail;
    }
  }
  return obtenerRolPerfil(supabase, user.id);
}

/** Si la migración de 4 roles ya está aplicada, persiste el rol del registro. */
export async function intentarSincronizarRolDesdeRegistro(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const meta = rolDesdeMetadataRegistro(user);
  if (!meta) {
    return;
  }
  await supabase.from("perfiles").update({ rol: meta }).eq("id", user.id);
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