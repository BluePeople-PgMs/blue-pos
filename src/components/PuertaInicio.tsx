"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { EVENTO_SESION, leerSesionLocal } from "@/lib/sesionLocal";
import { getSupabaseBrowser } from "@/lib/supabase";

export function PuertaInicio({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"cargando" | "ok">("cargando");

  useEffect(() => {
    let activo = true;

    function comprobar() {
      if (leerSesionLocal()) {
        if (activo) setEstado("ok");
        return;
      }

      const supabase = getSupabaseBrowser();
      if (!supabase) {
        router.replace("/login");
        return;
      }

      void supabase.auth.getUser().then(({ data }) => {
        if (!activo) return;
        if (data.user) {
          setEstado("ok");
          return;
        }
        router.replace("/login");
      });
    }

    comprobar();
    window.addEventListener(EVENTO_SESION, comprobar);
    return () => {
      activo = false;
      window.removeEventListener(EVENTO_SESION, comprobar);
    };
  }, [router]);

  if (estado !== "ok") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-muted" role="status">
          Comprobando sesión…
        </p>
      </main>
    );
  }

  return children;
}
