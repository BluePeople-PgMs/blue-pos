"use client";

import { StarRating } from "@/components/delivery/StarRating";
import {
  ETIQUETA_ESTADO,
  ORDEN_PROGRESO,
  type EstadoDelivery,
} from "@/lib/delivery/estados";
import {
  deliveryCalificar,
  listarItemsPedido,
  obtenerPedido,
  type DeliveryOrderItemRow,
  type DeliveryOrderRow,
} from "@/lib/delivery/servicio";
import { getSupabaseBrowser } from "@/lib/supabase";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function DeliverySeguimientoView({
  orderId,
  email,
}: {
  orderId: string;
  email?: string | null;
}) {
  const supabase = getSupabaseBrowser();
  const [pedido, setPedido] = useState<DeliveryOrderRow | null>(null);
  const [items, setItems] = useState<DeliveryOrderItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calPedido, setCalPedido] = useState<number | null>(null);
  const [calRepartidor, setCalRepartidor] = useState<number | null>(null);
  const [enviandoCal, setEnviandoCal] = useState(false);

  const recargar = useCallback(async () => {
    if (!supabase) return;
    const [o, i] = await Promise.all([
      obtenerPedido(supabase, orderId),
      listarItemsPedido(supabase, orderId),
    ]);
    if (o.error) {
      setError(o.error.message);
      return;
    }
    if (!o.data) {
      setError("Pedido no encontrado.");
      return;
    }
    setPedido(o.data as DeliveryOrderRow);
    setItems((i.data ?? []) as DeliveryOrderItemRow[]);
    if (i.error) {
      setError(i.error.message);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    void recargar();
    const t = setInterval(() => void recargar(), 8000);
    return () => clearInterval(t);
  }, [recargar]);

  async function enviarCalificacion() {
    if (!supabase || !pedido) return;
    setEnviandoCal(true);
    setError(null);
    const { error: rpcError } = await deliveryCalificar(
      supabase,
      pedido.id,
      calPedido,
      calRepartidor,
    );
    setEnviandoCal(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await recargar();
  }

  if (error && !pedido) {
    return (
      <p role="alert" className="text-sm text-danger">
        {error}
      </p>
    );
  }

  if (!pedido) {
    return (
      <p role="status" className="text-sm text-muted">
        Cargando pedido…
      </p>
    );
  }

  const pasoActual = ORDEN_PROGRESO.indexOf(pedido.status as EstadoDelivery);
  const entregado = pedido.status === "ENTREGADO";
  const yaCalificado =
    pedido.order_rating != null || pedido.driver_rating != null;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/delivery" className="text-sm font-medium text-accent">
          ← Nuevo pedido
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {pedido.folio ?? pedido.id.slice(0, 8)}
        </h1>
        {email ? <p className="text-xs text-muted">{email}</p> : null}
      </header>

      <ol className="flex flex-col gap-2">
        {ORDEN_PROGRESO.map((est, idx) => {
          const hecho = idx <= pasoActual;
          const actual = idx === pasoActual;
          return (
            <li
              key={est}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                actual
                  ? "border-accent bg-accent-soft/40 font-medium"
                  : hecho
                    ? "border-line bg-card"
                    : "border-line/60 opacity-60"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  hecho ? "bg-accent text-white" : "bg-line text-muted"
                }`}
              >
                {idx + 1}
              </span>
              {ETIQUETA_ESTADO[est]}
            </li>
          );
        })}
      </ol>

      {pedido.estimated_delivery_time && !entregado ? (
        <p className="text-sm text-muted">
          ETA estimada:{" "}
          {new Date(pedido.estimated_delivery_time).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}

      <section className="cine-panel px-4 py-4">
        <h2 className="text-sm font-semibold">Entrega</h2>
        <p className="mt-1 text-sm text-muted">{pedido.delivery_address}</p>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {items.map((it) => (
            <li key={it.id}>
              {it.productos?.nombre ?? "Producto"} · {Number(it.cantidad)} × $
              {Number(it.precio_unitario).toFixed(2)}
            </li>
          ))}
        </ul>
      </section>

      {entregado ? (
        <section className="cine-panel px-4 py-5">
          <h2 className="text-lg font-semibold">¿Cómo estuvo?</h2>
          {yaCalificado ? (
            <p className="mt-2 text-sm text-muted">
              Pedido: {pedido.order_rating ?? "—"} ★ · Repartidor:{" "}
              {pedido.driver_rating ?? "—"} ★
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-4">
                <StarRating
                  label="Tu pedido"
                  value={calPedido}
                  onChange={setCalPedido}
                />
                <StarRating
                  label="Repartidor"
                  value={calRepartidor}
                  onChange={setCalRepartidor}
                />
              </div>
              <button
                type="button"
                disabled={enviandoCal}
                className="cine-btn-primary mt-4 w-full py-3"
                onClick={() => void enviarCalificacion()}
              >
                {enviandoCal ? "Guardando…" : "Enviar calificación"}
              </button>
            </>
          )}
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}