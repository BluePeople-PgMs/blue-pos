"use client";

import {
  ETIQUETA_HISTORICO_ENTREGADO,
  etiquetaEstadoOps,
  textoCalificacion,
  type EstadoDelivery,
} from "@/lib/delivery/estados";
import { AvisoMaquetaDelivery } from "@/components/delivery/AvisoMaquetaDelivery";
import { deliverySoloMaqueta } from "@/lib/delivery/config";
import {
  maquetaCerrarEmpaque,
  maquetaIniciarEmpaque,
  maquetaListarItems,
  maquetaListarPedidosOps,
  maquetaTogglePacked,
  suscribirMaqueta,
} from "@/lib/delivery/maqueta";
import {
  deliveryCerrarEmpaque,
  deliveryIniciarEmpaque,
  deliveryToggleItemPacked,
  listarItemsPedido,
  listarPedidosOps,
  type DeliveryOrderItemRow,
  type DeliveryOrderRow,
} from "@/lib/delivery/servicio";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";

type TabOps = "activos" | "historico";

function notasPedido(p: DeliveryOrderRow): string | null {
  const n = p.delivery_notes;
  if (n == null || String(n).trim() === "") return null;
  return String(n).trim();
}

export function AdminDeliveryOpsView() {
  const supabase = getSupabaseBrowser();
  const [tab, setTab] = useState<TabOps>("activos");
  const [pedidos, setPedidos] = useState<DeliveryOrderRow[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [items, setItems] = useState<DeliveryOrderItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const historico = tab === "historico";

  const recargar = useCallback(async () => {
    setCargando(true);
    const statuses: EstadoDelivery[] | undefined = historico
      ? ["ENTREGADO"]
      : ["PENDIENTE", "EMPACANDO", "LISTO_PARA_PICKUP", "EN_CAMINO"];
    if (deliverySoloMaqueta()) {
      setPedidos(
        maquetaListarPedidosOps(statuses, !historico) as DeliveryOrderRow[],
      );
      setError(null);
      setCargando(false);
      return;
    }
    if (!supabase) {
      setCargando(false);
      return;
    }
    const { data, error: qError } = await listarPedidosOps(supabase, statuses, {
      ascending: !historico,
    });
    if (qError) {
      setError(qError.message);
      setCargando(false);
      return;
    }
    setPedidos((data ?? []) as DeliveryOrderRow[]);
    setError(null);
    setCargando(false);
  }, [supabase, historico]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    if (deliverySoloMaqueta() && !historico) {
      return suscribirMaqueta(() => void recargar());
    }
    if (!supabase || historico) return;

    const channel = supabase
      .channel("delivery-ops-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "delivery_orders",
          filter: "status=eq.PENDIENTE",
        },
        () => void recargar(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_orders",
        },
        () => void recargar(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, historico, recargar]);

  useEffect(() => {
    if (!seleccionado) {
      setItems([]);
      return;
    }
    if (deliverySoloMaqueta()) {
      setItems(maquetaListarItems(seleccionado));
      return;
    }
    if (!supabase) return;
    void listarItemsPedido(supabase, seleccionado).then(({ data, error: e }) => {
      if (e) setError(e.message);
      setItems((data ?? []) as DeliveryOrderItemRow[]);
    });
  }, [seleccionado, supabase]);

  const detalle = pedidos.find((p) => p.id === seleccionado) ?? null;

  const todosEmpacados = useMemo(
    () => items.length > 0 && items.every((i) => i.is_packed),
    [items],
  );

  async function iniciarEmpaque() {
    if (!detalle) return;
    const e = deliverySoloMaqueta()
      ? maquetaIniciarEmpaque(detalle.id).error
      : (await deliveryIniciarEmpaque(supabase!, detalle.id)).error;
    if (e) {
      setError(e.message);
      return;
    }
    await recargar();
  }

  async function togglePacked(itemId: string, packed: boolean) {
    const e = deliverySoloMaqueta()
      ? maquetaTogglePacked(itemId, packed).error
      : (await deliveryToggleItemPacked(supabase!, itemId, packed)).error;
    if (e) {
      setError(e.message);
      return;
    }
    if (deliverySoloMaqueta() && seleccionado) {
      setItems(maquetaListarItems(seleccionado));
      return;
    }
    const { data } = await listarItemsPedido(supabase!, seleccionado!);
    setItems((data ?? []) as DeliveryOrderItemRow[]);
  }

  async function cerrarEmpaque() {
    if (!detalle) return;
    const e = deliverySoloMaqueta()
      ? maquetaCerrarEmpaque(detalle.id).error
      : (await deliveryCerrarEmpaque(supabase!, detalle.id)).error;
    if (e) {
      setError(e.message);
      return;
    }
    await recargar();
  }

  return (
    <div className="flex flex-col gap-4">
      <AvisoMaquetaDelivery />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <section className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Delivery — operación</h1>
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-sm ${tab === "activos" ? "bg-brand-navy text-white" : "border border-line"}`}
              onClick={() => {
                setTab("activos");
                setSeleccionado(null);
              }}
            >
              Activos
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-sm ${tab === "historico" ? "bg-brand-navy text-white" : "border border-line"}`}
              onClick={() => {
                setTab("historico");
                setSeleccionado(null);
              }}
            >
              Histórico
            </button>
          </div>
        </header>

        {!historico ? (
          <p className="mt-1 text-xs text-muted">
            Entrantes ordenados del más antiguo al más reciente.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {cargando ? (
          <p className="mt-4 text-sm text-muted">Cargando bandeja…</p>
        ) : pedidos.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No hay pedidos en esta bandeja. Cuando un cliente confirme, aparecerá
            aquí como <strong>Pendiente</strong>.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {pedidos.map((p) => {
              const notas = notasPedido(p);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSeleccionado(p.id)}
                    className={`cine-panel w-full px-4 py-3 text-left ${
                      seleccionado === p.id ? "ring-2 ring-accent" : ""
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-mono font-medium">
                        {p.folio ?? p.id.slice(0, 8)}
                      </span>
                      <span className="text-xs font-medium text-accent">
                        {etiquetaEstadoOps(p.status, historico)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{p.delivery_address}</p>
                    {notas ? (
                      <p className="mt-0.5 truncate text-xs text-muted">
                        Notas: {notas}
                      </p>
                    ) : null}
                    {historico ? (
                      <p className="mt-1 text-xs text-muted">
                        Pedido: {textoCalificacion(p.order_rating)} · Repartidor:{" "}
                        {textoCalificacion(p.driver_rating)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted">
                        {new Date(p.created_at).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="cine-panel w-full px-4 py-4 lg:max-w-md">
        <h2 className="text-lg font-semibold">Detalle</h2>
        {!detalle ? (
          <p className="mt-2 text-sm text-muted">Selecciona un pedido.</p>
        ) : (
          <>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
              Dirección de entrega
            </p>
            <p className="mt-1 text-sm font-medium">{detalle.delivery_address}</p>
            {notasPedido(detalle) ? (
              <>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
                  Notas del cliente
                </p>
                <p className="mt-1 text-sm">{notasPedido(detalle)}</p>
              </>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              Estado: {etiquetaEstadoOps(detalle.status, historico)}
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-col gap-1 border-b border-line pb-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {it.productos?.nombre ?? "Ítem"} × {Number(it.cantidad)}
                    </span>
                    {detalle.status === "EMPACANDO" ? (
                      <label className="flex shrink-0 items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={it.is_packed}
                          onChange={(e) =>
                            void togglePacked(it.id, e.target.checked)
                          }
                        />
                        Empacado
                      </label>
                    ) : it.is_packed ? (
                      <span className="text-xs text-accent">✓</span>
                    ) : null}
                  </div>
                  {it.notas?.trim() ? (
                    <span className="text-xs text-muted">Notas: {it.notas.trim()}</span>
                  ) : null}
                </li>
              ))}
            </ul>

            {detalle.status === "PENDIENTE" ? (
              <button
                type="button"
                className="cine-btn-primary mt-4 w-full py-2.5 text-sm"
                onClick={() => void iniciarEmpaque()}
              >
                Iniciar empaque
              </button>
            ) : null}

            {detalle.status === "EMPACANDO" ? (
              <button
                type="button"
                className="cine-btn-primary mt-4 w-full py-2.5 text-sm"
                disabled={!todosEmpacados}
                onClick={() => void cerrarEmpaque()}
              >
                Cerrar pedido y enviar a Pick Up
              </button>
            ) : null}

            {detalle.status === "LISTO_PARA_PICKUP" ? (
              <p className="mt-4 text-sm text-accent">
                Esperando repartidor en tienda.
              </p>
            ) : null}

            {detalle.status === "EN_CAMINO" ? (
              <p className="mt-4 text-sm text-accent">En camino con repartidor.</p>
            ) : null}

            {historico && detalle.status === "ENTREGADO" ? (
              <div className="mt-4 rounded-lg border border-line bg-surface/50 p-3 text-sm">
                <p className="font-medium">{ETIQUETA_HISTORICO_ENTREGADO}</p>
                <p className="mt-2 text-xs text-muted">
                  Pedido: {textoCalificacion(detalle.order_rating)}
                </p>
                <p className="text-xs text-muted">
                  Repartidor: {textoCalificacion(detalle.driver_rating)}
                </p>
                {detalle.delivered_at ? (
                  <p className="mt-2 text-xs text-muted">
                    Entregado{" "}
                    {new Date(detalle.delivered_at).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
      </div>
    </div>
  );
}