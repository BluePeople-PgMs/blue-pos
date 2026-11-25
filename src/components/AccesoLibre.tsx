"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { guardarSesionLocal } from "@/lib/sesionLocal";
import { getSupabaseBrowser } from "@/lib/supabase";

/**
 * Entra directo al punto de venta. Si hay credenciales locales, abre la sesión
 * de Supabase sin mostrar el formulario de login.
 */
export function AccesoLibre({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<"entrando" | "listo" | "error">(
    "entrando",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function entrar() {
      const supabase = getSupabaseBrowser();
      const email = process.env.NEXT_PUBLIC_ACCESO_LIBRE_EMAIL?.trim();
      const password = process.env.NEXT_PUBLIC_ACCESO_LIBRE_PASSWORD?.trim();

      if (!supabase || !email || !password) {
        if (activo) setEstado("listo");
        return;
      }

      const { data: actual } = await supabase.auth.getSession();
      let abierta = actual.session;
      let errorMensaje: string | null = null;

      if (!abierta) {
        const firmada = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        abierta = firmada.data.session;
        errorMensaje = firmada.error?.message ?? null;
      }

      if (!activo) return;

      if (!abierta) {
        setMensaje(errorMensaje ?? "No se pudo abrir la sesión local.");
        setEstado("error");
        return;
      }

      guardarSesionLocal(abierta.user.email ?? email);
      setEstado("listo");
      if (pathname === "/login") {
        router.replace("/");
      }
    }

    void entrar();
    return () => {
      activo = false;
    };
  }, [pathname, router]);

  if (estado === "entrando") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-muted" role="status">
          Entrando…
        </p>
      </main>
    );
  }

  if (estado === "error") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-warn" role="alert">
          {mensaje}
        </p>
      </main>
    );
  }

  return children;
}
