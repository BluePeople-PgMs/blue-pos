"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EVENTO_SESION, leerSesionLocal } from "@/lib/sesionLocal";
import { getSupabaseBrowser } from "@/lib/supabase";

import type { ReactNode } from "react";

export function RequiereSesion({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<"cargando" | "ok" | "sin_sesion">(
    "cargando",
  );

  useEffect(() => {
    let activo = true;

    function sinSesion() {
      if (!activo) return;
      setEstado("sin_sesion");
      const destino = encodeURIComponent(pathname);
      router.replace(`/login?siguiente=${destino}`);
    }

    async function comprobar() {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        sinSesion();
        return;
      }

      const { data: sesionData } = await supabase.auth.getSession();
      if (!activo) return;
      if (sesionData.session) {
        setEstado("ok");
        return;
      }

      if (leerSesionLocal()) {
        const { data } = await supabase.auth.getUser();
        if (!activo) return;
        if (data.user) {
          setEstado("ok");
          return;
        }
      }

      sinSesion();
    }

    void comprobar();
    window.addEventListener(EVENTO_SESION, () => {
      void comprobar();
    });
    return () => {
      activo = false;
      window.removeEventListener(EVENTO_SESION, comprobar);
    };
  }, [pathname, router]);

  if (estado === "cargando") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-muted" role="status">
          Comprobando sesión…
        </p>
      </main>
    );
  }

  if (estado === "sin_sesion") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
        <section className="rounded-2xl border border-warn/30 bg-warn-soft px-5 py-4 text-warn">
          <h1 className="text-base font-semibold">Se necesita iniciar sesión</h1>
          <p className="mt-1 text-sm leading-6">
            Inventario, ventas, pagos y cancelaciones solo se leen y escriben con
            una sesión iniciada.
          </p>
          <Link
            href={`/login?siguiente=${encodeURIComponent(pathname)}`}
            className="mt-3 inline-block rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white"
          >
            Ir al login
          </Link>
        </section>
      </main>
    );
  }

  return children;
}