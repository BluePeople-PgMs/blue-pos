"use client";

import { obtenerRolEfectivo, ROL_CLIENTE, type RolPerfil } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type PerfilRolContextValue = {
  rol: RolPerfil | null;
  cargando: boolean;
  recargar: () => Promise<void>;
};

const PerfilRolContext = createContext<PerfilRolContextValue | null>(null);

export function PerfilRolProvider({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  const supabase = getSupabaseBrowser();
  const [rol, setRol] = useState<RolPerfil | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    if (!supabase) {
      setRol(null);
      setCargando(false);
      return;
    }
    const siguiente = await obtenerRolEfectivo(supabase, session.user);
    setRol(siguiente);
    setCargando(false);
  }, [session.user, supabase]);

  useEffect(() => {
    let activo = true;

    void (async () => {
      if (!supabase) {
        if (activo) {
          setRol(null);
          setCargando(false);
        }
        return;
      }
      const siguiente = await obtenerRolEfectivo(supabase, session.user);
      if (activo) {
        setRol(siguiente);
        setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [session.user, supabase]);

  return (
    <PerfilRolContext.Provider value={{ rol, cargando, recargar }}>
      {children}
    </PerfilRolContext.Provider>
  );
}

export function usePerfilRol(): PerfilRolContextValue {
  const ctx = useContext(PerfilRolContext);
  if (!ctx) {
    return {
      rol: ROL_CLIENTE,
      cargando: false,
      recargar: async () => {},
    };
  }
  return ctx;
}