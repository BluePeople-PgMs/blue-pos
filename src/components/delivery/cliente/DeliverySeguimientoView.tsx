"use client";

import { StarRating } from "@/components/delivery/StarRating";
import {
  ETIQUETA_ESTADO,
  ORDEN_PROGRESO,
  type EstadoDelivery,
} from "@/lib/delivery/estados";
import { AvisoMaquetaDelivery } from "@/components/delivery/AvisoMaquetaDelivery";
import { deliverySoloMaqueta } from "@/lib/delivery/config";
import { formatoCoordenadas } from "@/lib/delivery/mapaEntrega";
import {
  maquetaCalificar,
  maquetaListarItems,
  maquetaObtenerPedido,
  maquetaRepartidorEnCamino,
  suscribirMaqueta,
} from "@/lib/delivery/maqueta";
import {
  deliveryCalificar,
  listarItemsPedido,
  obtenerPedido,
  obtenerRepartidorEnCamino,
  type DeliveryOrderItemRow,
  type DeliveryOrderRow,
} from "@/lib/delivery/servicio";
import { getSupabaseBrowser } from "@/lib/supabase";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const CALIFICACION_OMITIDA_KEY = (orderId: string) =>
  `delivery-calificacion-omitida-${orderId}`;

function textoCalificacion(valor: number | null | undefined) {
  if (valor == null) {
    return "No calificado";
  }
  return `${valor} ★`;
}

function leerCalificacionOmitida(orderId: string) {
  try {
    return sessionStorage.getItem(CALIFICACION_OMITIDA_KEY(orderId)) === "1";
  } catch {
    return false;
  }
}

function marcarCalificacionOmitida(orderId: string) {
  try {
    sessionStorage.setItem(CALIFICACION_OMITIDA_KEY(orderId), "1");
  } catch {
    /* storage no disponible */
  }
}

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
  const [nombreRepartidor, setNombreRepartidor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calPedido, setCalPedido] = useState<number | null>(null);
  const [calRepartidor, setCalRepartidor] = useState<number | null>(null);
  const [enviandoCal, setEnviandoCal] = useState(false);
  const [calificacionOmitida, setCalificacionOmitida] = useState(() =>
    leerCalificacionOmitida(orderId),
  );

  const recargar = useCallback(async () => {
    if (deliverySoloMaqueta()) {
      const row = maquetaObtenerPedido(orderId);
      if (!row) {
        setError("Pedido no encontrado (maqueta).");
        setPedido(null);
        return;
      }
      setError(null);
      setPedido(row);
      setItems(maquetaListarItems(orderId));
      let repartidor = row.driver?.nombre?.trim() || null;
      if (row.status === "EN_CAMINO" && !repartidor) {
        const d = maquetaRepartidorEnCamino(orderId);
        repartidor = d?.driver_nombre?.trim() || null;
      }
      setNombreRepartidor(repartidor);
      return;
    }
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
    const row = o.data as DeliveryOrderRow;
    setPedido(row);
    setItems((i.data ?? []) as DeliveryOrderItemRow[]);
    if (i.error) {
      setError(i.error.message);
    }

    let repartidor = row.driver?.nombre?.trim() || null;
    if (row.status === "EN_CAMINO" && !repartidor) {
      const d = await obtenerRepartidorEnCamino(supabase, orderId);
      if (!d.error && d.data?.driver_nombre) {
        repartidor = d.data.driver_nombre.trim() || null;
      }
    }
    setNombreRepartidor(repartidor);
  }, [orderId, supabase]);

  useEffect(() => {
    void recargar();

    const poll = setInterval(() => void recargar(), 8000);

    if (deliverySoloMaqueta()) {
      const off = suscribirMaqueta(() => void recargar());
      return () => {
        clearInterval(poll);
        off();
      };
    }

    if (!supabase) {
      return () => clearInterval(poll);
    }

    const channel = supabase
      .channel(`delivery-order-cliente-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          void recargar();
        },
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [orderId, recargar, supabase]);

  async function enviarCalificacion() {
    if (!pedido) return;
    if (calPedido == null && calRepartidor == null) {
      setError("Elige al menos una estrella o toca “Omitir calificación”.");
      return;
    }
    setEnviandoCal(true);
    setError(null);
    let rpcError: { message: string } | null = null;
    if (deliverySoloMaqueta()) {
      rpcError = maquetaCalificar(pedido.id, calPedido, calRepartidor).error;
    } else if (supabase) {
      rpcError = (
        await deliveryCalificar(supabase, pedido.id, calPedido, calRepartidor)
      ).error;
    }
    setEnviandoCal(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await recargar();
  }

  function omitirCalificacion() {
    marcarCalificacionOmitida(orderId);
    setCalificacionOmitida(true);
    setError(null);
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
  const enCamino = pedido.status === "EN_CAMINO";
  const yaCalificado =
    pedido.order_rating != null ||
    pedido.driver_rating != null ||
    calificacionOmitida;

  return (
    <div className="flex flex-col gap-5">
      <AvisoMaquetaDelivery />
      <header>
        <Link href="/delivery" className="text-sm font-medium text-accent">
          ← Nuevo pedido
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {pedido.folio ?? pedido.id.slice(0, 8)}
        </h1>
        <p className="mt-1 text-sm font-medium text-foreground">
          {ETIQUETA_ESTADO[pedido.status as EstadoDelivery]}
        </p>
        {email ? <p className="text-xs text-muted">{email}</p> : null}
      </header>

      {enCamino ? (
        <section className="cine-panel border-accent/25 bg-accent-soft/30 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            En camino
          </p>
          <p className="mt-1 text-sm text-foreground">
            {nombreRepartidor
              ? `Tu repartidor: ${nombreRepartidor}`
              : "Tu pedido va en camino hacia ti."}
          </p>
        </section>
      ) : null}

      <ol className="flex flex-col gap-2" aria-label="Progreso del pedido">
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
          Llegada estimada:{" "}
          {new Date(pedido.estimated_delivery_time).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}

      <section className="cine-panel px-4 py-4">
        <h2 className="text-sm font-semibold">Entrega</h2>
        <p className="mt-1 text-sm text-muted">{pedido.delivery_address}</p>
        {pedido.delivery_lat != null && pedido.delivery_lng != null ? (
          <p className="mt-1 font-mono text-xs text-muted">
            Punto en mapa:{" "}
            {formatoCoordenadas({
              lat: Number(pedido.delivery_lat),
              lng: Number(pedido.delivery_lng),
            })}
          </p>
        ) : null}
        {pedido.delivery_notes?.trim() ? (
          <p className="mt-2 text-sm">
            <span className="font-medium text-foreground">Referencias: </span>
            <span className="text-muted">{pedido.delivery_notes.trim()}</span>
          </p>
        ) : null}
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
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Tu pedido</dt>
                <dd className="font-medium">
                  {textoCalificacion(pedido.order_rating)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Repartidor</dt>
                <dd className="font-medium">
                  {textoCalificacion(pedido.driver_rating)}
                </dd>
              </div>
            </dl>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                Puedes calificar el pedido, al repartidor o ambos. Toca de nuevo
                una estrella para quitarla.
              </p>
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
              <button
                type="button"
                disabled={enviandoCal}
                className="mt-2 w-full py-2 text-sm font-medium text-muted"
                onClick={omitirCalificacion}
              >
                Omitir calificación
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