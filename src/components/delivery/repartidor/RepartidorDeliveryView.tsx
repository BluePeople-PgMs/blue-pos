"use client";

import { ETIQUETA_ESTADO } from "@/lib/delivery/estados";
import { PICKUP_TIENDA } from "@/lib/delivery/config";
import { urlGoogleMapsRuta } from "@/lib/delivery/maps";
import {
  deliveryFinalizar,
  deliveryIniciarEntrega,
  listarItemsPedido,
  listarPedidosRepartidor,
  type DeliveryOrderItemRow,
  type DeliveryOrderRow,
} from "@/lib/delivery/servicio";
import { getSupabaseBrowser } from "@/lib/supabase";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function formatoMoneda(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function RepartidorDeliveryView({ email }: { email?: string | null }) {
  const supabase = getSupabaseBrowser();
  const [pedidos, setPedidos] = useState<DeliveryOrderRow[]>([]);
  const [detalle, setDetalle] = useState<DeliveryOrderRow | null>(null);
  const [items, setItems] = useState<DeliveryOrderItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const recargar = useCallback(async () => {
    if (!supabase) return;
    const { data, error: qError } = await listarPedidosRepartidor(supabase);
    if (qError) {
      setError(
        qError.message.includes("delivery_orders")
          ? `${qError.message} — aplica la migración delivery en Supabase.`
          : qError.message,
      );
      return;
    }
    setPedidos((data ?? []) as DeliveryOrderRow[]);
    setError(null);
  }, [supabase]);

  useEffect(() => {
    void recargar();
    const t = setInterval(() => void recargar(), 8000);
    return () => clearInterval(t);
  }, [recargar]);

  useEffect(() => {
    if (!supabase || !detalle) {
      setItems([]);
      return;
    }
    void listarItemsPedido(supabase, detalle.id).then(({ data }) => {
      setItems((data ?? []) as DeliveryOrderItemRow[]);
    });
  }, [detalle, supabase]);

  const listos = pedidos.filter((p) => p.status === "LISTO_PARA_PICKUP");
  const enCamino = pedidos.filter((p) => p.status === "EN_CAMINO");
  const total = items.reduce(
    (acc, it) => acc + Number(it.cantidad) * Number(it.precio_unitario),
    0,
  );

  async function iniciarRuta() {
    if (!supabase || !detalle) return;
    setProcesando(true);
    const { error: e } = await deliveryIniciarEntrega(supabase, detalle.id);
    setProcesando(false);
    if (e) {
      setError(e.message);
      return;
    }
    await recargar();
    const { data } = await listarPedidosRepartidor(supabase);
    const actualizado = (data ?? []).find((p) => p.id === detalle.id) as
      | DeliveryOrderRow
      | undefined;
    if (actualizado) setDetalle(actualizado);
  }

  async function finalizarEntrega() {
    if (!supabase || !detalle) return;
    setProcesando(true);
    const { error: e } = await deliveryFinalizar(supabase, detalle.id);
    setProcesando(false);
    if (e) {
      setError(e.message);
      return;
    }
    setDetalle(null);
    await recargar();
  }

  if (detalle) {
    const mapsUrl = urlGoogleMapsRuta({
      direccion: detalle.delivery_address,
      lat: detalle.delivery_lat,
      lng: detalle.delivery_lng,
    });
    const enCurso = detalle.status === "EN_CAMINO";

    return (
      <div className="repartidor-app">
        <header className="repartidor-topbar">
          <button
            type="button"
            className="repartidor-topbar__icon"
            onClick={() => setDetalle(null)}
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="repartidor-topbar__title">
            {detalle.folio ?? detalle.id.slice(0, 8)}
          </h1>
          <span className="w-10" />
        </header>

        <div className="repartidor-detalle-mapa repartidor-mapa-wrap repartidor-mapa-wrap--alto">
          <div className="repartidor-mapa flex min-h-[12rem] items-center justify-center p-6 text-center text-sm text-muted">
            Navegación con Google Maps
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="repartidor-btn-maps"
          >
            Abrir ruta en Maps
          </a>
        </div>

        <div className="repartidor-sheet">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {ETIQUETA_ESTADO[detalle.status]}
          </p>
          <h2 className="text-xl font-semibold">{detalle.delivery_address}</h2>
          <p className="mt-1 text-sm text-muted">
            Desde {PICKUP_TIENDA.direccion}
          </p>
          <ul className="mt-3 text-sm">
            {items.map((it) => (
              <li key={it.id}>
                {it.productos?.nombre ?? "Ítem"} × {Number(it.cantidad)}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-semibold">{formatoMoneda(total)}</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="repartidor-btn-outline">
              Incidencia
            </button>
            {enCurso ? (
              <button
                type="button"
                disabled={procesando}
                className="repartidor-btn-primary"
                onClick={() => void finalizarEntrega()}
              >
                Entregado
              </button>
            ) : (
              <button
                type="button"
                disabled={procesando}
                className="repartidor-btn-primary"
                onClick={() => void iniciarRuta()}
              >
                Iniciar ruta
              </button>
            )}
          </div>
          {!enCurso ? (
            <p className="mt-3 text-center text-xs text-muted">
              Al iniciar, el pedido queda en camino y se abre la ruta hacia el cliente.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="repartidor-app">
      <header className="repartidor-topbar">
        <span className="w-10" />
        <h1 className="repartidor-topbar__title">Entregas</h1>
        <span className="w-10" />
      </header>
      {email ? (
        <p className="repartidor-sub text-center text-xs text-white/70">{email}</p>
      ) : null}

      {error ? (
        <p role="alert" className="mx-3 mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section className="repartidor-contenido repartidor-contenido--lista px-3">
        <h2 className="mt-2 text-sm font-semibold text-muted">Listos en tienda</h2>
        {listos.length === 0 ? (
          <p className="text-sm text-muted">Ninguno por ahora.</p>
        ) : (
          <ul className="repartidor-lista mt-2">
            {listos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="repartidor-parada w-full"
                  onClick={() => setDetalle(p)}
                >
                  <span className="repartidor-parada__num">P</span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="font-mono text-sm">{p.folio}</span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {p.delivery_address}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-4 text-sm font-semibold text-muted">Mis rutas activas</h2>
        {enCamino.length === 0 ? (
          <p className="text-sm text-muted">—</p>
        ) : (
          <ul className="repartidor-lista mt-2">
            {enCamino.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="repartidor-parada w-full"
                  onClick={() => setDetalle(p)}
                >
                  <span className="repartidor-parada__num">→</span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="font-mono text-sm">{p.folio}</span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {p.delivery_address}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="repartidor-tabbar">
        <Link href="/repartidor/delivery" className="is-active">
          Servicios
        </Link>
        <Link href="/login" className="repartidor-tabbar__salir">
          Salir
        </Link>
      </nav>
    </div>
  );
}