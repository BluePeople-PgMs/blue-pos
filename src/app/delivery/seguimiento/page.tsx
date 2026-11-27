"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeliverySeguimiento } from "@/components/delivery/DeliverySeguimiento";
import { leerUltimoFolio } from "@/lib/delivery-storage";

export default function DeliverySeguimientoBuscarPage() {
  const router = useRouter();
  const [folio, setFolio] = useState(() => leerUltimoFolio() ?? "");
  const [activo, setActivo] = useState<string | null>(() =>
    leerUltimoFolio(),
  );

  function buscar() {
    const limpio = folio.trim().toUpperCase();
    if (!limpio) return;
    setActivo(limpio);
    router.replace(`/delivery/seguimiento?folio=${encodeURIComponent(limpio)}`);
  }

  return (
    <main className="flex flex-col gap-4 px-4">
      <h1 className="text-xl font-bold">Seguir pedido</h1>
      <div className="flex gap-2">
        <input
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
          placeholder="Folio D-…"
          className="flex-1 rounded-xl border border-[var(--delivery-line)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={buscar}
          className="delivery-btn-green rounded-full px-4 py-2 text-sm font-bold"
        >
          Ver
        </button>
      </div>
      {activo ? (
        <DeliverySeguimiento folio={activo} />
      ) : (
        <Link href="/delivery" className="text-sm text-[var(--delivery-muted)]">
          Volver al menú
        </Link>
      )}
    </main>
  );
}