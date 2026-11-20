import {
  ROL_PREDETERMINADO,
  esRolSistema,
  type RolSistema,
} from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase";

export async function leerRolUsuario(): Promise<{
  rol: RolSistema;
  error: string | null;
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { rol: ROL_PREDETERMINADO, error: "Sin cliente Supabase." };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { rol: ROL_PREDETERMINADO, error: "Sin sesión." };
  }

  const { data, error } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    const mensaje = error.message.toLowerCase();
    if (mensaje.includes("rol") && mensaje.includes("column")) {
      return { rol: "administrador", error: null };
    }
    if (mensaje.includes("permission") || mensaje.includes("jwt")) {
      return { rol: ROL_PREDETERMINADO, error: "Sin autorización para leer perfil." };
    }
    return { rol: ROL_PREDETERMINADO, error: error.message };
  }

  const crudo = data?.rol;
  if (typeof crudo === "string" && esRolSistema(crudo)) {
    return { rol: crudo, error: null };
  }

  return { rol: ROL_PREDETERMINADO, error: null };
}