"use client";

import { deliverySoloMaqueta } from "@/lib/delivery/config";
import { maquetaIdSeguimientoDemo, maquetaReiniciarDemo } from "@/lib/delivery/maqueta";
import Link from "next/link";

export function AvisoMaquetaDelivery() {
  if (!deliverySoloMaqueta()) {
    return null;
  }

  return (
    <div
      className="rounded-xl border border-accent/35 bg-accent-soft/25 px-3 py-2 text-sm text-foreground"
      role="status"
    >
      <p className="font-medium text-accent">
        Modo maqueta — sin base de datos
      </p>
      <p className="mt-0.5 text-xs text-muted">
        Los pedidos viven solo en esta sesión. Cambia de rol con la barra y prueba
        cliente → mesero → repartidor.
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <Link
          href="/delivery"
          className="rounded-full border border-line bg-card px-2.5 py-1 font-medium"
        >
          Cliente
        </Link>
        <Link
          href="/admin/delivery"
          className="rounded-full border border-line bg-card px-2.5 py-1 font-medium"
        >
          Mesero
        </Link>
        <Link
          href="/repartidor/delivery"
          className="rounded-full border border-line bg-card px-2.5 py-1 font-medium"
        >
          Repartidor
        </Link>
        <Link
          href={`/delivery/${maquetaIdSeguimientoDemo()}`}
          className="rounded-full border border-line bg-card px-2.5 py-1 font-medium"
        >
          Seguimiento EN_CAMINO
        </Link>
        <button
          type="button"
          className="rounded-full border border-line bg-card px-2.5 py-1 font-medium"
          onClick={() => maquetaReiniciarDemo()}
        >
          Reiniciar datos demo
        </button>
      </div>
    </div>
  );
}