"use client";

import { obtenerRolPerfil, ROL_MESERO, rutaInicioPorRol } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Ruta legada: meseros → /pedidos; administradores → inicio. */
export default function VentasLegacyPage() {
  const router = useRouter();

  useEffect(() => {
    let activo = true;

    void (async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const rol = await obtenerRolPerfil(supabase, data.session.user.id);
      if (!activo) return;
      router.replace(
        rol === ROL_MESERO ? "/pedidos" : rutaInicioPorRol(rol),
      );
    })();

    return () => {
      activo = false;
    };
  }, [router]);

  return (
    <main className="app-main">
      <p role="status" className="text-sm text-muted">
        Redirigiendo…
      </p>
    </main>
  );
}