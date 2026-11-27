"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";
import { obtenerRolPerfil, ROL_CLIENTE } from "@/lib/roles";
import { destinoSeguroParaRol } from "@/lib/rutas-por-rol";
import { destinoSeguro } from "@/lib/rutas-protegidas";

type GuardaPlataformaProps = {
  children: ReactNode;
};

export function GuardaPlataforma({ children }: GuardaPlataformaProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const enLogin = pathname === "/login";
  const next = destinoSeguro(searchParams.get("next"));

  const [session, setSession] = useState<Session | null | undefined>(
    supabase ? undefined : null,
  );
  const [sesionResuelta, setSesionResuelta] = useState(!supabase);

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

  useEffect(() => {
    if (session !== undefined) {
      setSesionResuelta(true);
    }
  }, [session]);

  useEffect(() => {
    if (session === undefined) {
      return;
    }

    if (!session && !enLogin) {
      const destino =
        pathname && pathname !== "/"
          ? `/login?next=${encodeURIComponent(pathname)}`
          : "/login";
      router.replace(destino);
      return;
    }

    if (session && enLogin && supabase) {
      void obtenerRolPerfil(supabase, session.user.id).then((rol) => {
        router.replace(destinoSeguroParaRol(next, rol ?? ROL_CLIENTE));
      });
    }
  }, [enLogin, next, pathname, router, session, supabase]);

  /** Solo la primera resolución de sesión en rutas protegidas; no ocultar hijos en /login. */
  const pantallaDeCarga =
    !enLogin && !sesionResuelta && session === undefined;

  if (pantallaDeCarga) {
    return (
      <main className="app-main">
        <p
          role="status"
          className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
        >
          Revisando sesión…
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
