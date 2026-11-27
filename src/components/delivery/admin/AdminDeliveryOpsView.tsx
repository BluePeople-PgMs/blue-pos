"use client";

import { ETIQUETA_ESTADO, type EstadoDelivery } from "@/lib/delivery/estados";
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
import { useCallback, useEffect, useState } from "react";

type TabOps = "activos" | "historico";

export function AdminDeliveryOpsView() {
  const supabase = getSupabaseBrowser();
  const [tab, setTab] = useState<TabOps>("activos");
  const [pedidos, setPedidos] = useState<DeliveryOrderRow[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [items, setItems] = useState<DeliveryOrderItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    if (!supabase) return;
    setCargando(true);
    const statuses: EstadoDelivery[] | undefined =
      tab === "historico"
        ? ["ENTREGADO"]
        : ["PENDIENTE", "EMPACANDO", "LISTO_PARA_PICKUP", "EN_CAMINO"];
    const { data, error: qError } = await listarPedidosOps(supabase, statuses);
    if (qError) {
      setError(qError.message);
      setCargando(false);
      return;
    }
    setPedidos((data ?? []) as DeliveryOrderRow[]);
    setError(null);
    setCargando(false);
  }, [supabase, tab]);

  useEffect(() => {
    void recargar();
    const t = setInterval(() => void recargar(), 10000);
    return () => clearInterval(t);
  }, [recargar]);

  useEffect(() => {
    if (!supabase || !seleccionado) {
      setItems([]);
      return;
    }
    void listarItemsPedido(supabase, seleccionado).then(({ data, error: e }) => {
      if (e) setError(e.message);
      setItems((data ?? []) as DeliveryOrderItemRow[]);
    });
  }, [seleccionado, supabase]);

  const detalle = pedidos.find((p) => p.id === seleccionado) ?? null;

  async function iniciarEmpaque() {
    if (!supabase || !detalle) return;
    const { error: e } = await deliveryIniciarEmpaque(supabase, detalle.id);
    if (e) {
      setError(e.message);
      return;
    }
    await recargar();
  }

  async function togglePacked(itemId: string, packed: boolean) {
    if (!supabase) return;
    const { error: e } = await deliveryToggleItemPacked(supabase, itemId, packed);
    if (e) {
      setError(e.message);
      return;
    }
    const { data } = await listarItemsPedido(supabase, seleccionado!);
    setItems((data ?? []) as DeliveryOrderItemRow[]);
  }

  async function cerrarEmpaque() {
    if (!supabase || !detalle) return;
    const { error: e } = await deliveryCerrarEmpaque(supabase, detalle.id);
    if (e) {
      setError(e.message);
      return;
    }
    await recargar();
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <section className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Delivery — operación</h1>
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-sm ${tab === "activos" ? "bg-brand-navy text-white" : "border border-line"}`}
              onClick={() => setTab("activos")}
            >
              Activos
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-sm ${tab === "historico" ? "bg-brand-navy text-white" : "border border-line"}`}
              onClick={() => setTab("historico")}
            >
              Histórico
            </button>
          </div>
        </header>

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
            {pedidos.map((p) => (
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
                      {ETIQUETA_ESTADO[p.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {p.delivery_address}
                  </p>
                  {tab === "historico" ? (
                    <p className="mt-1 text-xs text-muted">
                      Pedido {p.order_rating ?? "—"}★ · Repartidor{" "}
                      {p.driver_rating ?? "No calificado"}★
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cine-panel w-full px-4 py-4 lg:max-w-md">
        <h2 className="text-lg font-semibold">Detalle</h2>
        {!detalle ? (
          <p className="mt-2 text-sm text-muted">Selecciona un pedido.</p>
        ) : (
          <>
            <p className="mt-2 text-sm">{detalle.delivery_address}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-2 border-b border-line pb-2"
                >
                  <span>
                    {it.productos?.nombre ?? "Ítem"} × {Number(it.cantidad)}
                  </span>
                  {detalle.status === "EMPACANDO" ? (
                    <label className="flex items-center gap-1 text-xs">
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
                </li>
              ))}
            </ul>

            {detalle.status === "PENDIENTE" ? (
              <button
                type="button"
                className="cine-btn-primary mt-4 w-full py-2.5 text-sm"
                onClick={() => void iniciarEmpaque()}
              >
                Recibir e iniciar empaque
              </button>
            ) : null}

            {detalle.status === "EMPACANDO" ? (
              <button
                type="button"
                className="cine-btn-primary mt-4 w-full py-2.5 text-sm"
                disabled={items.some((i) => !i.is_packed)}
                onClick={() => void cerrarEmpaque()}
              >
                Cerrar empaque (listo pickup)
              </button>
            ) : null}

            {detalle.status === "LISTO_PARA_PICKUP" ? (
              <p className="mt-4 text-sm text-accent">
                Esperando repartidor en tienda.
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}