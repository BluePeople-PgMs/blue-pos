"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ENTREGA_ESTADOS,
  ETIQUETA_ENTREGA,
  type PedidoDelivery,
} from "@/lib/delivery-mock";
import { EVENTO_PEDIDOS } from "@/lib/delivery-storage";
import { leerPedidoDelivery } from "@/lib/delivery";

export function DeliverySeguimiento({ folio }: { folio: string }) {
  const [pedido, setPedido] = useState<PedidoDelivery | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    const p = await leerPedidoDelivery(folio);
    setPedido(p);
    setCargando(false);
  }, [folio]);

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
    const intervalo = window.setInterval(() => void recargar(), 2500);
    return () => {
      window.removeEventListener(EVENTO_PEDIDOS, onCustom);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(intervalo);
    };
  }, [recargar]);

  if (cargando && !pedido) {
    return <p className="text-sm text-[var(--delivery-muted)]">Cargando pedido…</p>;
  }

  if (!pedido) {
    return (
      <p className="text-sm text-[var(--delivery-muted)]">
        No encontramos el folio {folio}.
      </p>
    );
  }

  const indiceActual = ENTREGA_ESTADOS.indexOf(pedido.entregaEstado);
  const entregado = pedido.entregaEstado === "entregado";

  return (
    <div className="flex flex-col gap-5">
      {entregado ? (
        <>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--delivery-green)] text-4xl text-white">
            ✓
          </div>
          <h2 className="text-center text-2xl font-bold">¡Llegó a tu puerta!</h2>
          <p className="text-center text-sm text-[var(--delivery-muted)]">
            Gracias por pedir en Trattoria Blue
          </p>
        </>
      ) : (
        <>
          <h2 className="text-center text-xl font-bold">Sigue tu pedido</h2>
          <p className="text-center font-mono text-sm text-[var(--delivery-muted)]">
            {pedido.folio}
          </p>
        </>
      )}

      <ol className="flex flex-col gap-0" aria-label="Estado del pedido">
        {ENTREGA_ESTADOS.map((estado, indice) => {
          const hecho = indice <= indiceActual;
          const actual = indice === indiceActual;
          return (
            <li key={estado} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    hecho
                      ? "bg-[var(--delivery-green)] text-white"
                      : "bg-[var(--delivery-line)] text-[var(--delivery-muted)]"
                  } ${actual && !entregado ? "ring-4 ring-[var(--delivery-green)]/30" : ""}`}
                >
                  {hecho ? "✓" : indice + 1}
                </span>
                {indice < ENTREGA_ESTADOS.length - 1 ? (
                  <span
                    className={`my-1 min-h-6 w-0.5 flex-1 ${
                      indice < indiceActual
                        ? "bg-[var(--delivery-green)]"
                        : "bg-[var(--delivery-line)]"
                    }`}
                  />
                ) : null}
              </span>
              <span className="pb-6 pt-1">
                <span
                  className={`block text-sm font-semibold ${
                    actual ? "text-[var(--delivery-green-dark)]" : ""
                  }`}
                >
                  {ETIQUETA_ENTREGA[estado]}
                </span>
                {actual && !entregado ? (
                  <span className="text-xs text-[var(--delivery-muted)]">
                    {mensajeCliente(estado)}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl bg-[var(--delivery-card)] p-4 text-sm shadow-sm">
        <p>
          <span className="text-[var(--delivery-muted)]">Entrega en</span>
          <br />
          {pedido.direccionEntrega}
        </p>
        <p className="mt-2">
          Total ${pedido.total.toFixed(0)} · {pedido.metodoPago}
        </p>
      </div>

      {!entregado ? (
        <Link
          href="/delivery"
          className="text-center text-sm text-[var(--delivery-muted)]"
        >
          Mientras esperas, ver menú
        </Link>
      ) : (
        <Link
          href="/delivery"
          className="delivery-btn-green rounded-full py-3 text-center text-sm font-bold"
        >
          Pedir de nuevo
        </Link>
      )}
    </div>
  );
}

function mensajeCliente(estado: PedidoDelivery["entregaEstado"]) {
  switch (estado) {
    case "recibido":
      return "El restaurante acaba de recibir tu pedido.";
    case "preparando":
      return "Cocina está preparando tu comida.";
    case "en_camino":
      return "El repartidor va hacia tu dirección.";
    case "entregado":
      return "Pedido entregado.";
    default:
      return "";
  }
}