"use client";

import { usePerfilRol } from "@/context/PerfilRolContext";
import { deliverySoloMaqueta } from "@/lib/delivery/config";
import { maquetaIdSeguimientoDemo, maquetaReiniciarDemo } from "@/lib/delivery/maqueta";
import { ROL_CLIENTE, ROL_MESERO, ROL_REPARTIDOR } from "@/lib/roles";
import Link from "next/link";

export function AvisoMaquetaDelivery() {
  const { rol } = usePerfilRol();

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
        Los pedidos viven solo en esta sesión. Para probar otro rol, cierra sesión
        e inicia con una cuenta distinta (cliente, mesero o repartidor).
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {rol === ROL_CLIENTE ? (
          <Link
            href={`/delivery/${maquetaIdSeguimientoDemo()}`}
            className="rounded-full border border-line bg-card px-2.5 py-1 font-medium"
          >
            Ver demo seguimiento EN_CAMINO
          </Link>
        ) : null}
        {rol === ROL_MESERO || rol === ROL_REPARTIDOR || rol === ROL_CLIENTE ? (
          <button
            type="button"
            className="rounded-full border border-line bg-card px-2.5 py-1 font-medium"
            onClick={() => maquetaReiniciarDemo()}
          >
            Reiniciar datos demo
          </button>
        ) : null}
      </div>
    </div>
  );
}