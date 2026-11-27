"use client";

import { PerfilRolProvider, usePerfilRol } from "@/context/PerfilRolContext";
import { rutaInicioPorRol } from "@/lib/roles";
import {
  debeRedirigirDesdeInicio,
  rutaPermitidaParaRol,
} from "@/lib/rutas-por-rol";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function GuardaRolContenido({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { rol, cargando } = usePerfilRol();
  const [rolListo, setRolListo] = useState(false);

  useEffect(() => {
    if (!cargando && rol) {
      setRolListo(true);
    }
  }, [cargando, rol]);

  useEffect(() => {
    if (cargando || !rol || pathname === "/login") {
      return;
    }

    if (debeRedirigirDesdeInicio(rol, pathname)) {
      router.replace(rutaInicioPorRol(rol));
      return;
    }

    if (!rutaPermitidaParaRol(rol, pathname)) {
      router.replace(rutaInicioPorRol(rol));
    }
  }, [cargando, pathname, rol, router]);

  if (pathname !== "/login" && cargando && !rolListo) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <p
          role="status"
          className="brand-surface rounded-2xl px-5 py-4 text-sm text-muted"
        >
          Revisando rol…
        </p>
      </main>
    );
  }

  if (
    rol &&
    pathname !== "/login" &&
    !rutaPermitidaParaRol(rol, pathname)
  ) {
    return (
      <main className="app-main">
        <p role="status" className="text-sm text-muted">
          Redirigiendo…
        </p>
      </main>
    );
  }

  return children;
}

export function GuardaRol({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const supabase = getSupabaseBrowser();
  const [session, setSession] = useState<Session | null | undefined>(
    supabase ? undefined : null,
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (activo) {
        setSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, actual) => {
      setSession(actual);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (pathname === "/login" || !session) {
    return <>{children}</>;
  }

  if (session === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <p role="status" className="brand-surface rounded-2xl px-5 py-4 text-sm text-muted">
          Revisando rol…
        </p>
      </main>
    );
  }

  return (
    <PerfilRolProvider session={session}>
      <GuardaRolContenido>{children}</GuardaRolContenido>
    </PerfilRolProvider>
  );
}