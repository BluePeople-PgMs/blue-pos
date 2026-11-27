"use client";

import { AvisoMaquetaDelivery } from "@/components/delivery/AvisoMaquetaDelivery";
import { CatalogoVentaCinepolis } from "@/components/pos/CatalogoVentaCinepolis";
import { cargarCatalogoDelivery } from "@/lib/delivery/catalogoCliente";
import { deliverySoloMaqueta } from "@/lib/delivery/config";
import { maquetaCargarCatalogo, maquetaCrearPedido } from "@/lib/delivery/maqueta";
import type { ArticuloMenuVenta } from "@/lib/ventas/catalogoVentaVisual";
import { PICKUP_TIENDA } from "@/lib/delivery/config";
import {
  filtrarArticulosMenu,
  type FiltroCatalogoTab,
} from "@/lib/ventas/filtrosMenuCliente";
import { SelectorPuntoMapa } from "@/components/delivery/cliente/SelectorPuntoMapa";
import type { PuntoEntrega } from "@/lib/delivery/mapaEntrega";
import { deliveryCrearPedido } from "@/lib/delivery/servicio";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type LineaCarritoDelivery = {
  lineaId: string;
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  esCombo: boolean;
};

function formatoMoneda(monto: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(monto);
}

function nuevaLineaId() {
  return `l-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DeliveryClienteView({ email }: { email?: string | null }) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articulos, setArticulos] = useState<ArticuloMenuVenta[]>([]);
  const [filtroQuery, setFiltroQuery] = useState("");
  const [filtroTab, setFiltroTab] = useState<FiltroCatalogoTab>("todos");
  const [articuloId, setArticuloId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [carrito, setCarrito] = useState<LineaCarritoDelivery[]>([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [referencias, setReferencias] = useState("");
  const [puntoEntrega, setPuntoEntrega] = useState<PuntoEntrega | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (deliverySoloMaqueta()) {
      setCargando(true);
      setError(null);
      const articulosMq = maquetaCargarCatalogo();
      setArticulos(articulosMq);
      setArticuloId(articulosMq[0]?.id ?? "");
      setCargando(false);
      return;
    }
    if (!supabase) {
      setError("Falta configuración de Supabase.");
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    const datos = await cargarCatalogoDelivery(supabase);
    if ("error" in datos) {
      setError(datos.error);
      setCargando(false);
      return;
    }
    setArticulos(datos.articulos);
    const ids = datos.articulos.map((a) => a.id);
    setArticuloId((prev) => (prev && ids.includes(prev) ? prev : (ids[0] ?? "")));
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const articulosFiltrados = useMemo(
    () => filtrarArticulosMenu(articulos, { query: filtroQuery, tab: filtroTab }),
    [articulos, filtroQuery, filtroTab],
  );

  const totalCarrito = useMemo(
    () =>
      carrito.reduce(
        (acc, l) => acc + l.cantidad * l.precioUnitario,
        0,
      ),
    [carrito],
  );

  const unidadesCarrito = useMemo(
    () => carrito.reduce((acc, l) => acc + l.cantidad, 0),
    [carrito],
  );

  function agregarAlCarrito() {
    const art = articulos.find((a) => a.id === articuloId);
    const qty = Number.parseFloat(cantidad.replace(",", "."));
    if (!art || !Number.isFinite(qty) || qty <= 0) {
      return;
    }
    if (qty > art.stockDisponible) {
      setError(`Solo hay ${art.stockDisponible} disponibles de “${art.nombre}”.`);
      return;
    }
    if (art.stockDisponible <= 0) {
      setError(`“${art.nombre}” está agotado por ahora.`);
      return;
    }
    setError(null);
    setCarrito((prev) => [
      ...prev,
      {
        lineaId: nuevaLineaId(),
        productoId: art.id,
        nombre: art.nombre,
        precioUnitario: art.precioUnitario,
        cantidad: qty,
        esCombo: art.esCombo,
      },
    ]);
    setCantidad("1");
  }

  function quitarLinea(lineaId: string) {
    setCarrito((prev) => prev.filter((l) => l.lineaId !== lineaId));
  }

  async function confirmarPedido() {
    const dir = direccion.trim();
    if (!dir) {
      setError("Escribe la dirección de entrega.");
      return;
    }
    if (puntoEntrega == null) {
      setError("Marca el punto de entrega en el mapa.");
      return;
    }
    if (carrito.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }
    setConfirmando(true);
    setError(null);

    const items = carrito.map((l) => ({
      producto_id: l.productoId,
      cantidad: l.cantidad,
      precio_unitario: l.precioUnitario,
      es_combo: l.esCombo,
    }));

    if (deliverySoloMaqueta()) {
      const { data } = maquetaCrearPedido(
        dir,
        items,
        referencias,
        puntoEntrega,
      );
      if (data?.id) {
        setCarrito([]);
        setMostrarCheckout(false);
        setMostrarCarrito(false);
        setConfirmando(false);
        router.push(`/delivery/${data.id}`);
      }
      setConfirmando(false);
      return;
    }

    if (!supabase) {
      setConfirmando(false);
      return;
    }

    const { data, error: rpcError } = await deliveryCrearPedido(
      supabase,
      dir,
      items,
      referencias,
      puntoEntrega,
    );

    if (rpcError) {
      setError(
        rpcError.message.includes("delivery_crear_pedido") ||
          rpcError.code === "PGRST202"
          ? `${rpcError.message} — ¿Ejecutaste la migración delivery_orders en Supabase?`
          : rpcError.message,
      );
      setConfirmando(false);
      return;
    }

    const payload = data as { id?: string; folio?: string } | null;
    const orderId = payload?.id;
    if (orderId) {
      setCarrito([]);
      setMostrarCheckout(false);
      setMostrarCarrito(false);
      setConfirmando(false);
      router.push(`/delivery/${orderId}`);
      return;
    }

    setPedidoConfirmado(payload?.folio ?? "Pedido registrado");
    setCarrito([]);
    setMostrarCheckout(false);
    setMostrarCarrito(false);
    setConfirmando(false);
  }

  const tabs: { id: FiltroCatalogoTab; label: string }[] = [
    { id: "todos", label: "Todo" },
    { id: "productos", label: "Productos" },
    { id: "combos", label: "Combos" },
    { id: "promo", label: "Promo" },
  ];

  return (
    <div className="delivery-cliente mx-auto flex w-full max-w-lg flex-col gap-4 pb-28">
      <AvisoMaquetaDelivery />
      <header className="delivery-cliente-hero px-1 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Delivery
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          ¿Qué se te antoja?
        </h1>
        <p className="mt-1 text-sm text-muted">
          Elige productos o combos; recogemos en {PICKUP_TIENDA.nombre} y te lo
          llevamos.
        </p>
        {email ? (
          <p className="mt-1 truncate text-xs text-muted">{email}</p>
        ) : null}
      </header>

      {pedidoConfirmado ? (
        <section
          role="status"
          className="cine-panel border-accent/30 bg-accent-soft/50 px-5 py-5"
        >
          <h2 className="text-lg font-semibold text-foreground">¡Pedido enviado!</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Folio <span className="font-mono font-medium">{pedidoConfirmado}</span>
            {". "}
            Cuando exista la función{" "}
            <code className="font-mono text-xs">delivery_crear_pedido</code> en
            Supabase, el pedido quedará en la base; por ahora guardamos un borrador
            local para pruebas.
          </p>
          <button
            type="button"
            className="cine-btn-primary mt-4 w-full py-3 text-sm"
            onClick={() => setPedidoConfirmado(null)}
          >
            Hacer otro pedido
          </button>
        </section>
      ) : null}

      {!pedidoConfirmado ? (
        <>
          <div className="flex flex-col gap-3 px-1">
            <input
              type="search"
              placeholder="Buscar en el menú…"
              value={filtroQuery}
              onChange={(e) => setFiltroQuery(e.target.value)}
              className="cine-input w-full rounded-xl border border-line bg-card px-4 py-3 text-sm"
            />
            <div
              className="flex gap-2 overflow-x-auto pb-0.5"
              role="tablist"
              aria-label="Filtros"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={filtroTab === t.id}
                  onClick={() => setFiltroTab(t.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    filtroTab === t.id
                      ? "bg-[var(--cine-navy)] text-white"
                      : "bg-card text-muted border border-line"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p role="alert" className="mx-1 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          {cargando ? (
            <p role="status" className="px-1 text-sm text-muted">
              Cargando menú…
            </p>
          ) : (
            <CatalogoVentaCinepolis
              articulos={articulosFiltrados}
              articuloId={articuloId}
              onArticuloIdChange={setArticuloId}
              cantidad={cantidad}
              onCantidadChange={setCantidad}
              onAgregar={agregarAlCarrito}
              formatoMoneda={formatoMoneda}
              tituloCatalogo="Elige para delivery"
              subtituloCatalogo="Toca un platillo, ajusta cantidad y agrégalo al carrito."
              etiquetaAgregar="Agregar al carrito"
            />
          )}
        </>
      ) : null}

      {!pedidoConfirmado && unidadesCarrito > 0 ? (
        <div className="delivery-cliente-bar fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex w-full max-w-lg items-center gap-3 rounded-2xl bg-[var(--cine-navy)] px-4 py-3 text-white shadow-lg">
            <button
              type="button"
              onClick={() => setMostrarCarrito(true)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block text-xs text-white/75">
                {unidadesCarrito} artículo{unidadesCarrito === 1 ? "" : "s"}
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatoMoneda(totalCarrito)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarCarrito(true);
                setMostrarCheckout(true);
              }}
              className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[var(--cine-navy)]"
            >
              Pedir
            </button>
          </div>
        </div>
      ) : null}

      {mostrarCarrito ? (
        <div className="delivery-overlay" role="presentation">
          <button
            type="button"
            className="delivery-overlay__scrim"
            aria-label="Cerrar"
            onClick={() => {
              setMostrarCarrito(false);
              setMostrarCheckout(false);
            }}
          />
          <div className="delivery-sheet">
            <div className="delivery-sheet__handle" aria-hidden />
            <h2 className="text-lg font-semibold">
              {mostrarCheckout ? "Entrega" : "Tu pedido"}
            </h2>

            {!mostrarCheckout ? (
              <>
                <ul className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto">
                  {carrito.map((l) => (
                    <li
                      key={l.lineaId}
                      className="flex items-start justify-between gap-2 border-b border-line pb-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{l.nombre}</p>
                        <p className="text-muted">
                          {l.cantidad} × {formatoMoneda(l.precioUnitario)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-danger text-xs font-medium"
                        onClick={() => quitarLinea(l.lineaId)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-right text-lg font-semibold">
                  Total {formatoMoneda(totalCarrito)}
                </p>
                <button
                  type="button"
                  className="cine-btn-primary mt-4 w-full py-3"
                  onClick={() => setMostrarCheckout(true)}
                >
                  Continuar
                </button>
              </>
            ) : (
              <>
                <label className="mt-4 block text-sm font-medium">
                  Dirección de entrega
                </label>
                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  rows={3}
                  placeholder="Calle, número, colonia…"
                  className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm"
                />
                <div className="mt-4">
                  <SelectorPuntoMapa
                    value={puntoEntrega}
                    onChange={setPuntoEntrega}
                  />
                </div>
                <label className="mt-4 block text-sm font-medium">
                  Referencias o notas adicionales
                  <span className="font-normal text-muted"> (opcional)</span>
                </label>
                <textarea
                  value={referencias}
                  onChange={(e) => setReferencias(e.target.value)}
                  rows={2}
                  placeholder="Ej. casa azul, portón negro, timbre roto…"
                  className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm"
                />
                <p className="mt-2 text-xs text-muted">
                  Desde: {PICKUP_TIENDA.direccion}
                </p>
                <button
                  type="button"
                  disabled={confirmando}
                  className="cine-btn-primary mt-6 w-full py-3.5 text-sm font-semibold"
                  onClick={() => void confirmarPedido()}
                >
                  {confirmando ? "Confirmando…" : "Confirmar delivery"}
                </button>
                <button
                  type="button"
                  className="mt-2 w-full py-2 text-sm text-muted"
                  onClick={() => setMostrarCheckout(false)}
                >
                  Volver al carrito
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}