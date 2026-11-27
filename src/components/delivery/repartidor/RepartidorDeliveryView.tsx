"use client";

import { AvisoMaquetaDelivery } from "@/components/delivery/AvisoMaquetaDelivery";
import { ETIQUETA_ESTADO } from "@/lib/delivery/estados";
import { PICKUP_TIENDA, deliverySoloMaqueta } from "@/lib/delivery/config";
import {
  maquetaFinalizar,
  maquetaHistoricoRepartidor,
  maquetaIniciarEntrega,
  maquetaListarItems,
  maquetaListarPedidosRepartidor,
  suscribirMaqueta,
} from "@/lib/delivery/maqueta";
import {
  latLngAPorcentaje,
  porcentajeTiendaPickup,
} from "@/lib/delivery/mapaEntrega";
import {
  urlGoogleMapsRuta,
  urlGoogleMapsTienda,
  urlWazeNavegacion,
} from "@/lib/delivery/maps";
import {
  deliveryFinalizar,
  deliveryIniciarEntrega,
  listarHistoricoEntregasRepartidor,
  listarItemsPedido,
  listarPedidosRepartidor,
  type DeliveryOrderItemRow,
  type DeliveryOrderRow,
} from "@/lib/delivery/servicio";
import { getSupabaseBrowser } from "@/lib/supabase";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TabRepartidor = "activos" | "historico";

type HistoricoRow = Pick<
  DeliveryOrderRow,
  "id" | "folio" | "delivery_address" | "delivered_at" | "created_at"
>;

function formatoMoneda(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatoFechaCorta(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mensajeErrorRepartidor(raw: string): string {
  if (raw.includes("Pedido no disponible")) {
    return "Otro repartidor ya tomó este pedido. Actualiza la lista y elige otro.";
  }
  if (raw.includes("No se puede finalizar")) {
    return "No pudimos finalizar: verifica que el pedido siga en camino.";
  }
  return raw;
}

export function RepartidorDeliveryView({ email }: { email?: string | null }) {
  const supabase = getSupabaseBrowser();
  const [tab, setTab] = useState<TabRepartidor>("activos");
  const [pedidos, setPedidos] = useState<DeliveryOrderRow[]>([]);
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [detalle, setDetalle] = useState<DeliveryOrderRow | null>(null);
  const [items, setItems] = useState<DeliveryOrderItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const recargar = useCallback(async () => {
    if (deliverySoloMaqueta()) {
      setPedidos(maquetaListarPedidosRepartidor());
      setError(null);
      return;
    }
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

  const recargarHistorico = useCallback(async () => {
    if (deliverySoloMaqueta()) {
      setHistorico(maquetaHistoricoRepartidor());
      return;
    }
    if (!supabase) return;
    const { data } = await listarHistoricoEntregasRepartidor(supabase);
    setHistorico((data ?? []) as HistoricoRow[]);
  }, [supabase]);

  const recargarTodo = useCallback(async () => {
    await recargar();
    await recargarHistorico();
  }, [recargar, recargarHistorico]);

  useEffect(() => {
    void recargarTodo();
    const t = setInterval(() => void recargarTodo(), 8000);
    const off = deliverySoloMaqueta()
      ? suscribirMaqueta(() => void recargarTodo())
      : () => {};
    return () => {
      clearInterval(t);
      off();
    };
  }, [recargarTodo]);

  useEffect(() => {
    if (!detalle) {
      setItems([]);
      return;
    }
    if (deliverySoloMaqueta()) {
      setItems(maquetaListarItems(detalle.id));
      return;
    }
    if (!supabase) return;
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

  const destinoMaps = detalle
    ? {
        direccion: detalle.delivery_address,
        lat: detalle.delivery_lat,
        lng: detalle.delivery_lng,
      }
    : null;

  async function iniciarEntrega() {
    if (!detalle) return;
    setProcesando(true);
    setError(null);
    const e = deliverySoloMaqueta()
      ? maquetaIniciarEntrega(detalle.id).error
      : (await deliveryIniciarEntrega(supabase!, detalle.id)).error;
    setProcesando(false);
    if (e) {
      setError(mensajeErrorRepartidor(e.message));
      await recargarTodo();
      return;
    }
    await recargarTodo();
    const lista = deliverySoloMaqueta()
      ? maquetaListarPedidosRepartidor()
      : (((await listarPedidosRepartidor(supabase!)).data ?? []) as DeliveryOrderRow[]);
    const actualizado = lista.find((p) => p.id === detalle.id);
    if (actualizado) {
      setDetalle(actualizado);
      if (destinoMaps) {
        window.open(urlGoogleMapsRuta(destinoMaps), "_blank", "noopener,noreferrer");
      }
    } else {
      setDetalle(null);
    }
  }

  async function finalizarEntrega() {
    if (!detalle) return;
    setProcesando(true);
    setError(null);
    const e = deliverySoloMaqueta()
      ? maquetaFinalizar(detalle.id).error
      : (await deliveryFinalizar(supabase!, detalle.id)).error;
    setProcesando(false);
    if (e) {
      setError(mensajeErrorRepartidor(e.message));
      return;
    }
    setDetalle(null);
    await recargarTodo();
  }

  if (detalle && destinoMaps) {
    const googleUrl = urlGoogleMapsRuta(destinoMaps);
    const wazeUrl = urlWazeNavegacion(destinoMaps);
    const enCurso = detalle.status === "EN_CAMINO";
    const tiendaPos = porcentajeTiendaPickup();
  const clientePos =
      detalle.delivery_lat != null && detalle.delivery_lng != null
        ? latLngAPorcentaje({
            lat: Number(detalle.delivery_lat),
            lng: Number(detalle.delivery_lng),
          })
        : { left: 78, top: 38 };

    return (
      <div className="repartidor-app">
        <header className="repartidor-topbar">
          <button
            type="button"
            className="repartidor-topbar__icon"
            onClick={() => {
              setDetalle(null);
              setError(null);
            }}
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="repartidor-topbar__title">
            {detalle.folio ?? detalle.id.slice(0, 8)}
          </h1>
          <span
            className="repartidor-topbar__pill"
            style={{ justifySelf: "end", fontSize: "0.65rem" }}
          >
            {enCurso ? "En ruta" : "Pickup"}
          </span>
        </header>

        <div className="repartidor-detalle-mapa repartidor-mapa-wrap repartidor-mapa-wrap--alto">
          <div className="repartidor-mapa">
            <svg
              className="repartidor-mapa__ruta"
              viewBox="0 0 320 180"
              aria-hidden
            >
              <path
                d="M 48 115 Q 120 60 200 45 T 272 72"
                fill="none"
                stroke="var(--repartidor-accent)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
            </svg>
            <span
              className="repartidor-mapa__origen"
              style={{ left: `${tiendaPos.left}%`, top: `${tiendaPos.top}%` }}
            >
              Tienda
            </span>
            <span
              className="repartidor-mapa__pin"
              style={{ left: `${tiendaPos.left}%`, top: `${tiendaPos.top}%` }}
            >
              W
            </span>
            <span
              className="repartidor-mapa__pin repartidor-mapa__pin--activo"
              style={{ left: `${clientePos.left}%`, top: `${clientePos.top}%` }}
            >
              ★
            </span>
          </div>
          <div className="repartidor-maps-dock">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="repartidor-btn-nav"
            >
              Google Maps
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="repartidor-btn-nav repartidor-btn-nav--waze"
            >
              Waze
            </a>
          </div>
        </div>

        <div className="repartidor-sheet">
          {error ? (
            <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {ETIQUETA_ESTADO[detalle.status]}
          </p>

          <div className="repartidor-ruta-timeline mt-3">
            <div className="repartidor-ruta-timeline__row">
              <span className="repartidor-ruta-timeline__dot" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-muted">Recoger</p>
                <p className="font-semibold">{PICKUP_TIENDA.nombre}</p>
                <p className="text-sm text-muted">{PICKUP_TIENDA.direccion}</p>
                <a
                  href={urlGoogleMapsTienda()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-[var(--repartidor-accent)]"
                >
                  Ver tienda en mapa
                </a>
              </div>
            </div>
            <div className="repartidor-ruta-timeline__line" aria-hidden />
            <div className="repartidor-ruta-timeline__row">
              <span
                className="repartidor-ruta-timeline__dot repartidor-ruta-timeline__dot--dest"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-muted">Entregar</p>
                <p className="text-lg font-semibold leading-snug">
                  {detalle.delivery_address}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--cine-line)] bg-slate-50/80 px-3 py-2">
            <p className="text-xs font-semibold uppercase text-muted">Pedido</p>
            <ul className="mt-1 text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2 py-0.5">
                  <span className="truncate">
                    {it.productos?.nombre ?? "Ítem"} × {Number(it.cantidad)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-[var(--cine-line)] pt-2 font-semibold">
              {formatoMoneda(total)}
            </p>
          </div>

          <div className="repartidor-sticky-cta mt-4 grid gap-3">
            {enCurso ? (
              <button
                type="button"
                disabled={procesando}
                className="repartidor-btn-primary w-full"
                onClick={() => void finalizarEntrega()}
              >
                {procesando ? "Guardando…" : "Finalizar entrega"}
              </button>
            ) : (
              <button
                type="button"
                disabled={procesando}
                className="repartidor-btn-primary w-full"
                onClick={() => void iniciarEntrega()}
              >
                {procesando ? "Tomando pedido…" : "Iniciar entrega"}
              </button>
            )}
            {enCurso ? (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repartidor-btn-secondary text-center"
                >
                  Maps
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repartidor-btn-secondary text-center"
                >
                  Waze
                </a>
              </div>
            ) : (
              <p className="text-center text-xs text-muted">
                Al iniciar, el pedido queda en camino y se abre la ruta hacia el cliente.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="repartidor-app">
      <header className="repartidor-topbar">
        <span className="w-10" />
        <h1 className="repartidor-topbar__title">Entregas</h1>
        <span className="repartidor-topbar__pill">
          {listos.length + enCamino.length}
        </span>
      </header>
      {email ? (
        <p className="repartidor-sub text-center text-xs text-white/70">{email}</p>
      ) : null}

      {deliverySoloMaqueta() ? (
        <div className="repartidor-aviso-demo mx-3">
          <AvisoMaquetaDelivery />
        </div>
      ) : null}

      <div className="repartidor-segment" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "activos"}
          className={tab === "activos" ? "is-active" : ""}
          onClick={() => setTab("activos")}
        >
          Activos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "historico"}
          className={tab === "historico" ? "is-active" : ""}
          onClick={() => setTab("historico")}
        >
          Histórico
        </button>
      </div>

      {error ? (
        <p role="alert" className="mx-3 mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section className="repartidor-contenido repartidor-contenido--lista">
        {tab === "activos" ? (
          <>
            <div className="repartidor-stats mx-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Punto de recogida
              </p>
              <p className="mt-1 font-semibold">{PICKUP_TIENDA.nombre}</p>
              <p className="text-sm text-muted">{PICKUP_TIENDA.direccion}</p>
            </div>

            <h2 className="mx-3 mt-4 text-sm font-semibold text-muted">
              Listos en tienda
              <span className="ml-1 font-mono text-[var(--repartidor-accent)]">
                ({listos.length})
              </span>
            </h2>
            {listos.length === 0 ? (
              <p className="mx-3 text-sm text-muted">Ninguno por ahora.</p>
            ) : (
              <ul className="repartidor-lista mt-2">
                {listos.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="repartidor-parada w-full"
                      onClick={() => {
                        setError(null);
                        setDetalle(p);
                      }}
                    >
                      <span className="repartidor-parada__num">P</span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="font-mono text-sm font-semibold">
                          {p.folio ?? p.id.slice(0, 8)}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted">
                          → {p.delivery_address}
                        </span>
                      </span>
                      <span className="repartidor-parada__chev" aria-hidden>
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="mx-3 mt-4 text-sm font-semibold text-muted">
              Mis rutas en camino
              <span className="ml-1 font-mono text-[var(--repartidor-accent)]">
                ({enCamino.length})
              </span>
            </h2>
            {enCamino.length === 0 ? (
              <p className="mx-3 text-sm text-muted">Sin entregas activas.</p>
            ) : (
              <ul className="repartidor-lista mt-2">
                {enCamino.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="repartidor-parada w-full"
                      onClick={() => {
                        setError(null);
                        setDetalle(p);
                      }}
                    >
                      <span className="repartidor-parada__num">→</span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="font-mono text-sm font-semibold">
                          {p.folio ?? p.id.slice(0, 8)}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted">
                          {p.delivery_address}
                        </span>
                      </span>
                      <span className="repartidor-parada__chev" aria-hidden>
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="mx-3 mt-2 text-xs text-muted">
              Tus entregas completadas (últimas 30).
            </p>
            {historico.length === 0 ? (
              <p className="mx-3 mt-2 text-sm text-muted">Aún no hay entregas en tu historial.</p>
            ) : (
              <ul className="repartidor-lista repartidor-lista--compact mt-2">
                {historico.map((p) => (
                  <li
                    key={p.id}
                    className="repartidor-parada repartidor-parada--solo-lectura"
                  >
                    <span className="repartidor-parada__num">✓</span>
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-semibold">
                        {p.folio ?? p.id.slice(0, 8)}
                      </span>
                      <span className="mt-0.5 block truncate text-sm">
                        {p.delivery_address}
                      </span>
                      <span className="text-xs text-muted">
                        {formatoFechaCorta(p.delivered_at)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <nav className="repartidor-tabbar">
        <button
          type="button"
          className={tab === "activos" ? "is-active" : ""}
          onClick={() => setTab("activos")}
        >
          Servicios
        </button>
        <button
          type="button"
          className={tab === "historico" ? "is-active" : ""}
          onClick={() => setTab("historico")}
        >
          Historial
        </button>
        <Link href="/login" className="repartidor-tabbar__salir">
          Salir
        </Link>
      </nav>
    </div>
  );
}