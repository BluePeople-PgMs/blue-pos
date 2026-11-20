"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EVENTO_SESION } from "@/lib/sesionLocal";
import { leerRolUsuario } from "@/lib/perfil";
import {
  ROL_PREDETERMINADO,
  etiquetaRol,
  type RolSistema,
} from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase";

type EstadoRol = "cargando" | "listo" | "invitado";

type RolContexto = {
  estado: EstadoRol;
  rol: RolSistema;
  esAdministrador: boolean;
  etiqueta: string;
  recargar: () => Promise<void>;
};

const Contexto = createContext<RolContexto | null>(null);

export function RolProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoRol>("cargando");
  const [rol, setRol] = useState<RolSistema>(ROL_PREDETERMINADO);

  const recargar = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setEstado("invitado");
      setRol(ROL_PREDETERMINADO);
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setEstado("invitado");
      setRol(ROL_PREDETERMINADO);
      return;
    }

    const resultado = await leerRolUsuario();
    setRol(resultado.rol);
    setEstado("listo");
  }, []);

  useEffect(() => {
    let activo = true;

    void (async () => {
      await recargar();
      if (!activo) return;
    })();

    const supabase = getSupabaseBrowser();
    const sub = supabase?.auth.onAuthStateChange(() => {
      void recargar();
    });

    const onSesion = () => {
      void recargar();
    };
    window.addEventListener(EVENTO_SESION, onSesion);

    return () => {
      activo = false;
      sub?.data.subscription.unsubscribe();
      window.removeEventListener(EVENTO_SESION, onSesion);
    };
  }, [recargar]);

  const valor = useMemo<RolContexto>(
    () => ({
      estado,
      rol,
      esAdministrador: rol === "administrador",
      etiqueta: etiquetaRol(rol),
      recargar,
    }),
    [estado, rol, recargar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRol() {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useRol debe usarse dentro de RolProvider");
  }
  return ctx;
}