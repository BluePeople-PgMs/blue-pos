"use client";

import { useEffect, useState } from "react";
import { asegurarSesionDelivery } from "@/lib/delivery-auth";
import { getSupabaseBrowser } from "@/lib/supabase";

/** Intenta sesión anónima en /delivery cuando hay Supabase configurado. */
export function DeliveryAuthInit() {
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    void asegurarSesionDelivery().then((r) => {
      if (!r.ok && r.error) setAviso(r.error);
    });
  }, []);

  if (!aviso) return null;
  return (
    <p className="mx-4 mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
      {aviso} Puedes seguir en modo local sin base de datos.
    </p>
  );
}