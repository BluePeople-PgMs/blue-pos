export const EVENTO_SESION = "bluepos-sesion";

const CLAVE = "bluepos_sesion_local";

export type SesionLocal = {
  email: string;
};

export function leerSesionLocal(): SesionLocal | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(CLAVE);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as SesionLocal;
    if (!data.email?.trim()) {
      return null;
    }
    return { email: data.email.trim() };
  } catch {
    return null;
  }
}

export function guardarSesionLocal(email: string) {
  sessionStorage.setItem(CLAVE, JSON.stringify({ email: email.trim() }));
  emitirCambioSesion();
}

export function borrarSesionLocal() {
  sessionStorage.removeItem(CLAVE);
  emitirCambioSesion();
}

export function emitirCambioSesion() {
  window.dispatchEvent(new Event(EVENTO_SESION));
}

export function tieneSesionAplicacion(usuarioSupabase: boolean): boolean {
  return usuarioSupabase || leerSesionLocal() !== null;
}