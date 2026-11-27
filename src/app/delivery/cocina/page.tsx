"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RequiereSesion } from "@/components/RequiereSesion";
import {
  ETIQUETA_ENTREGA,
  siguienteEntregaEstado,
  type PedidoDelivery,
} from "@/lib/delivery-mock";
import { EVENTO_PEDIDOS } from "@/lib/delivery-storage";
import {
  avanzarEntregaDelivery,
  listarPedidosDeliveryActivos,
} from "@/lib/delivery";
import { getSupabaseBrowser } from "@/lib/supabase";

function CocinaContenido() {
  const [pedidos, setPedidos] = useState<PedidoDelivery[]>([]);
  const [entregados, setEntregados] = useState<PedidoDelivery[]>([]);
  const [origen, setOrigen] = useState<"local" | "supabase">("local");

  const recargar = useCallback(async () => {
    const activos = await listarPedidosDeliveryActivos();
    setPedidos(activos.pedidos);
    setOrigen(activos.origen);
    const { leerPedidos } = await import("@/lib/delivery-storage");
    setEntregados(
      leerPedidos()
        .filter((p) => p.entregaEstado === "entregado")
        .slice(0, 8),
    );
  }, []);

  useEffect(() => {
    void recargar();
    const onCustom = () => {
      void recargar();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bluepos_delivery_pedidos") void recargar();
    };
    window.addEventListener(EVENTO_PEDIDOS, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENTO_PEDIDOS, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [recargar]);

  const porEstado = (estado: PedidoDelivery["entregaEstado"]) =>
    pedidos.filter((p) => p.entregaEstado === estado);

  async function avanzar(folio: string, sig: PedidoDelivery["entregaEstado"]) {
    const { error } = await avanzarEntregaDelivery(folio, sig);
    if (error) return;
    await recargar();
  }

  return (
    <main className="flex flex-col gap-4 px-4">
      <h1 className="text-xl font-bold">Cocina · pedidos delivery</h1>
      <p className="text-xs text-[var(--delivery-muted)]">
        Fuente: {origen === "supabase" ? "Supabase" : "localStorage"}. Demo:
        pestaña cliente en <code className="font-mono">/delivery/pedido/…</code>
      </p>
      {pedidos.length === 0 ? (
        <p className="text-sm">No hay pedidos activos.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {(["recibido", "preparando", "en_camino"] as const).map((estado) => (
            <section key={estado}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--delivery-muted)]">
                {ETIQUETA_ENTREGA[estado]}
              </h2>
              <ul className="flex flex-col gap-3">
                {porEstado(estado).map((p) => {
                  const sig = siguienteEntregaEstado(p.entregaEstado);
                  return (
                    <li
                      key={p.id}
                      className="rounded-2xl border border-[var(--delivery-line)] bg-[var(--delivery-card)] p-4"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-mono text-sm font-bold">
                          {p.folio}
                        </span>
                        <span className="text-sm font-semibold">
                          ${p.total.toFixed(0)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{p.clienteNombre}</p>
                      <p className="text-xs text-[var(--delivery-muted)]">
                        {p.direccionEntrega}
                      </p>
                      <ul className="mt-2 text-xs">
                        {p.lineas.map((l) => (
                          <li key={`${l.productoId}-${l.nombre}`}>
                            {l.cantidad}× {l.nombre}
                          </li>
                        ))}
                      </ul>
                      {sig ? (
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            className="delivery-btn-green w-full rounded-full py-2 text-xs font-bold"
                            onClick={() => void avanzar(p.folio, sig)}
                          >
                            {sig === "entregado"
                              ? "Marcar entregado al cliente"
                              : `→ ${ETIQUETA_ENTREGA[sig]}`}
                          </button>
                          <a
                            href={`/delivery/pedido/${p.folio}`}
                            className="text-center text-xs text-[var(--delivery-muted)] underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir vista cliente
                          </a>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      {entregados.length > 0 ? (
        <section className="mt-4 border-t border-[var(--delivery-line)] pt-4">
          <h2 className="mb-2 text-sm font-bold text-[var(--delivery-muted)]">
            Entregados al cliente
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {entregados.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="font-mono">{p.folio}</span>
                <span>{p.clienteNombre}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Link href="/ventas" className="text-center text-sm text-[var(--delivery-muted)]">
        Ir al POS
      </Link>
    </main>
  );
}

export default function DeliveryCocinaPage() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return <CocinaContenido />;
  }
  return (
    <RequiereSesion>
      <CocinaContenido />
    </RequiereSesion>
  );
}