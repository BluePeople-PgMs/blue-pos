"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  agregarLinea,
  cancelarVentaAbierta,
  cancelarVentaCobrada,
  cobrarVenta,
  crearVentaAbierta,
  existenciasDeLineas,
  leerCatalogoVentas,
  leerVenta,
  listarVentas,
  resumenCambiosExistencia,
  type MetodoPago,
  type ProductoVenta,
  type VentaDetalle,
  type VentaLista,
} from "@/lib/ventas";

function dinero(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

function textoCantidad(valor: number) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 }).format(
    valor,
  );
}

function etiquetaMetodo(metodo: string) {
  if (metodo === "efectivo") return "Efectivo";
  if (metodo === "tarjeta") return "Tarjeta";
  if (metodo === "transferencia") return "Transferencia";
  return metodo;
}

function textoResumenExistencia(
  cambios: ReturnType<typeof resumenCambiosExistencia>,
) {
  if (cambios.length === 0) return "";
  return cambios
    .map(
      (c) =>
        `${c.nombre}: ${textoCantidad(c.anterior)} → ${textoCantidad(c.siguiente)}`,
    )
    .join(" · ");
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

type FiltroLista = "todas" | VentaLista["estado"];
type TonoMensaje = "info" | "ok" | "error";

function InsigniaEstado({ estado }: { estado: VentaLista["estado"] }) {
  const base =
    "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide";
  if (estado === "abierta") {
    return (
      <span className={`${base} bg-olive-soft text-olive`}>Abierta</span>
    );
  }
  if (estado === "cobrada") {
    return (
      <span className={`${base} bg-accent-soft text-accent`}>Pagada</span>
    );
  }
  return (
    <span className={`${base} bg-background text-muted ring-1 ring-line`}>
      Cancelada
    </span>
  );
}

const METODOS: { id: MetodoPago; titulo: string; detalle: string }[] = [
  { id: "efectivo", titulo: "Efectivo", detalle: "Caja" },
  { id: "tarjeta", titulo: "Tarjeta", detalle: "Terminal" },
  { id: "transferencia", titulo: "Transferencia", detalle: "SPEI" },
];

export function VentasVista() {
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [puedeOperar, setPuedeOperar] = useState(false);
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [ventas, setVentas] = useState<VentaLista[]>([]);
  const [ventaId, setVentaId] = useState<string | null>(null);
  const [venta, setVenta] = useState<VentaDetalle | null>(null);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [notasLinea, setNotasLinea] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tonoMensaje, setTonoMensaje] = useState<TonoMensaje>("info");
  const [enlaceInventario, setEnlaceInventario] = useState(false);
  const [filtroLista, setFiltroLista] = useState<FiltroLista>("todas");
  const [busquedaProducto, setBusquedaProducto] = useState("");

  const recargar = useCallback(async () => {
    const [catalogo, lista] = await Promise.all([
      leerCatalogoVentas(),
      listarVentas(),
    ]);
    setAviso(catalogo.error ?? lista.error);
    setPuedeOperar(!catalogo.error && !lista.error);
    setProductos(catalogo.productos);
    setVentas(lista.ventas);
    setCargando(false);
  }, []);

  const cargarVenta = useCallback(async (id: string) => {
    const { error, venta: detalle } = await leerVenta(id);
    if (error) {
      setMensaje(error);
      setTonoMensaje("error");
      setVenta(null);
      return;
    }
    setVenta(detalle);
  }, []);

  useEffect(() => {
    let activo = true;
    void (async () => {
      const [catalogo, lista] = await Promise.all([
        leerCatalogoVentas(),
        listarVentas(),
      ]);
      if (!activo) return;
      setAviso(catalogo.error ?? lista.error);
      setPuedeOperar(!catalogo.error && !lista.error);
      setProductos(catalogo.productos);
      setVentas(lista.ventas);
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const ventasVisibles = useMemo(() => {
    if (filtroLista === "todas") return ventas;
    return ventas.filter((v) => v.estado === filtroLista);
  }, [ventas, filtroLista]);

  const productosSugeridos = useMemo(() => {
    const consulta = normalizar(busquedaProducto.trim());
    const base = consulta
      ? productos.filter(
          (p) =>
            normalizar(p.nombre).includes(consulta) ||
            normalizar(p.codigo).includes(consulta),
        )
      : productos.filter((p) => p.existencia > 0);
    return base.slice(0, 12);
  }, [productos, busquedaProducto]);

  const productoSel = productos.find((p) => p.id === productoId);

  function publicarMensaje(texto: string, tono: TonoMensaje, inventario = false) {
    setMensaje(texto);
    setTonoMensaje(tono);
    setEnlaceInventario(inventario);
  }

  async function seleccionarVenta(id: string) {
    setVentaId(id);
    setMensaje(null);
    await cargarVenta(id);
  }

  async function nuevaVenta() {
    setMensaje(null);
    setEnviando(true);
    const { error, ventaId: id } = await crearVentaAbierta(null);
    setEnviando(false);
    if (error || !id) {
      publicarMensaje(error ?? "No se creó la venta.", "error");
      return;
    }
    await recargar();
    await seleccionarVenta(id);
    setFiltroLista("abierta");
    publicarMensaje(
      "Venta nueva lista. Busca un producto y agrégalo al carrito.",
      "ok",
    );
  }

  function ajustarCantidad(delta: number) {
    const actual = Number(cantidad);
    const siguiente = (Number.isFinite(actual) ? actual : 0) + delta;
    setCantidad(String(Math.max(1, siguiente)));
  }

  async function agregar() {
    if (!ventaId) return;
    const numero = Number(cantidad);
    if (!productoId || !(numero > 0)) {
      publicarMensaje("Elige un producto y una cantidad mayor a cero.", "error");
      return;
    }
    setEnviando(true);
    const { error } = await agregarLinea({
      ventaId,
      productoId,
      cantidad: numero,
      notas: notasLinea,
    });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    setNotasLinea("");
    setBusquedaProducto("");
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje("Producto agregado a la venta.", "ok");
  }

  async function cobrar() {
    if (!ventaId || !venta) return;
    setEnlaceInventario(false);
    const antes = await existenciasDeLineas(venta.lineasDetalle);
    setEnviando(true);
    const { error } = await cobrarVenta({ ventaId, metodo });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    const despues = await existenciasDeLineas(venta.lineasDetalle);
    const cambios = resumenCambiosExistencia(
      venta.lineasDetalle,
      antes.cantidades,
      despues.cantidades,
    );
    const resumen = textoResumenExistencia(cambios);
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje(
      resumen
        ? `¡Cobrado! Inventario: ${resumen}.`
        : "¡Cobrado! El inventario ya restó las existencias.",
      "ok",
      true,
    );
  }

  async function cancelarAbierta() {
    if (!ventaId) return;
    setEnviando(true);
    const { error } = await cancelarVentaAbierta(ventaId);
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje(
      "Venta cancelada antes del cobro (sin movimiento en inventario).",
      "info",
    );
  }

  async function cancelarCobrada() {
    if (!ventaId || !venta) return;
    setEnlaceInventario(false);
    const antes = await existenciasDeLineas(venta.lineasDetalle);
    setEnviando(true);
    const { error } = await cancelarVentaCobrada({
      ventaId,
      motivo: motivo,
    });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    const despues = await existenciasDeLineas(venta.lineasDetalle);
    const cambios = resumenCambiosExistencia(
      venta.lineasDetalle,
      antes.cantidades,
      despues.cantidades,
    );
    const resumen = textoResumenExistencia(cambios);
    setMotivo("");
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje(
      resumen
        ? `Venta cancelada. Existencias: ${resumen}.`
        : "Venta cancelada. La existencia se devolvió.",
      "ok",
      true,
    );
  }

  if (cargando) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-card px-6 py-10 text-center"
      >
        <p className="text-sm text-muted">Preparando el punto de cobro…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {aviso ? (
        <p
          role="status"
          className="rounded-2xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-warn"
        >
          {aviso}
        </p>
      ) : null}

      {mensaje ? (
        <div
          role="status"
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-sm ${
            tonoMensaje === "ok"
              ? "border-olive/25 bg-olive-soft text-foreground"
              : tonoMensaje === "error"
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-line bg-card text-muted"
          }`}
        >
          <span>{mensaje}</span>
          {enlaceInventario ? (
            <Link
              href="/inventario"
              className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Ver inventario
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Ventas recientes</h2>
            <button
              type="button"
              disabled={!puedeOperar || enviando}
              onClick={() => void nuevaVenta()}
              className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              + Nueva venta
            </button>
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filtrar ventas"
          >
            {(
              [
                ["todas", "Todos"],
                ["abierta", "Abiertos"],
                ["cobrada", "Pagadas"],
                ["cancelada", "Cancelados"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={filtroLista === valor}
                onClick={() => setFiltroLista(valor)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  filtroLista === valor
                    ? "bg-foreground text-background"
                    : "bg-background text-muted ring-1 ring-line"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {ventasVisibles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-background px-4 py-8 text-center text-sm text-muted">
              <p>No hay ventas con este filtro.</p>
              <button
                type="button"
                disabled={!puedeOperar || enviando}
                onClick={() => void nuevaVenta()}
                className="mt-3 text-sm font-semibold text-accent underline-offset-2 hover:underline disabled:opacity-50"
              >
                Crear el primero
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {ventasVisibles.map((v) => {
                const activa = v.id === ventaId;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => void seleccionarVenta(v.id)}
                      className={`flex w-full flex-col gap-2 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                        activa
                          ? "border-accent bg-accent-soft shadow-sm"
                          : "border-line bg-background hover:border-accent/40"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {v.folio ?? v.id.slice(0, 8)}
                        </span>
                        <InsigniaEstado estado={v.estado} />
                      </span>
                      <span className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-muted">
                          {v.lineas} artículo{v.lineas === 1 ? "" : "s"}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {dinero(v.total)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          {!venta ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line bg-card px-6 py-16 text-center">
              <p className="max-w-sm text-base text-muted">
                Elige una venta de la lista o abre una cuenta nueva para cobrar.
              </p>
              <button
                type="button"
                disabled={!puedeOperar || enviando}
                onClick={() => void nuevaVenta()}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Abrir nueva venta
              </button>
            </div>
          ) : (
            <section className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-card">
              <header className="border-b border-line bg-background/80 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      Venta seleccionada
                    </p>
                    <h2 className="mt-1 font-mono text-2xl font-semibold tracking-tight">
                      Folio {venta.folio ?? "—"}
                    </h2>
                  </div>
                  <InsigniaEstado estado={venta.estado} />
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-accent">
                  {dinero(venta.total)}
                </p>
                {venta.pago ? (
                  <p className="mt-2 text-sm text-muted">
                    Cobrado con {etiquetaMetodo(venta.pago.metodo)} ·{" "}
                    {dinero(venta.pago.monto)}
                  </p>
                ) : null}
                {venta.cancelacion ? (
                  <p className="mt-1 text-sm text-muted">
                    Motivo de cancelación:{" "}
                    {venta.cancelacion.motivo?.trim() ||
                      "Sin motivo capturado"}
                  </p>
                ) : null}
              </header>

              <div className="px-5">
                <h3 className="text-sm font-semibold text-muted">Carrito</h3>
                {venta.lineasDetalle.length > 0 ? (
                  <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-background">
                    {venta.lineasDetalle.map((linea) => (
                      <li
                        key={linea.id}
                        className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">
                            {linea.producto}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {textoCantidad(linea.cantidad)} ×{" "}
                            {dinero(linea.precioUnitario)}
                            {linea.codigo ? (
                              <span className="font-mono"> · {linea.codigo}</span>
                            ) : null}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {dinero(linea.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-xl border border-dashed border-line bg-background px-4 py-6 text-center text-sm text-muted">
                    El carrito está vacío. Agrega productos del catálogo.
                  </p>
                )}
              </div>

              {venta.estado === "abierta" ? (
                <div className="flex flex-col gap-5 border-t border-line px-5 py-5">
                  <div>
                    <h3 className="text-base font-semibold">
                      Agregar al carrito
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      Busca por nombre o código. Solo aparecen productos con
                      stock o los que coincidan con tu búsqueda.
                    </p>
                    <label className="mt-3 flex flex-col gap-1.5 text-sm font-medium">
                      Buscar producto
                      <input
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                        placeholder="Ej. spaghetti, COM-031…"
                        className="rounded-xl border border-line bg-background px-3 py-2.5 text-base font-normal outline-none focus:border-accent"
                      />
                    </label>
                    <ul className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                      {productosSugeridos.map((p) => {
                        const activo = p.id === productoId;
                        const sinStock = p.existencia <= 0;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => setProductoId(p.id)}
                              className={`flex w-full flex-col gap-1 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                                activo
                                  ? "border-accent bg-accent-soft"
                                  : "border-line bg-background hover:border-accent/50"
                              } ${sinStock ? "opacity-70" : ""}`}
                            >
                              <span className="line-clamp-2 font-medium leading-snug">
                                {p.nombre}
                              </span>
                              <span className="text-xs text-muted">
                                {dinero(p.precio)} · stock{" "}
                                {textoCantidad(p.existencia)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {productosSugeridos.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">
                        Ningún producto coincide. Prueba otro término.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium">Cantidad</span>
                      <div className="flex items-center gap-1 rounded-xl border border-line bg-background p-1">
                        <button
                          type="button"
                          aria-label="Quitar uno"
                          onClick={() => ajustarCantidad(-1)}
                          className="flex size-9 items-center justify-center rounded-lg text-lg font-medium hover:bg-accent-soft"
                        >
                          −
                        </button>
                        <input
                          value={cantidad}
                          onChange={(e) => setCantidad(e.target.value)}
                          inputMode="decimal"
                          className="w-14 border-0 bg-transparent text-center text-base font-semibold tabular-nums outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Agregar uno"
                          onClick={() => ajustarCantidad(1)}
                          className="flex size-9 items-center justify-center rounded-lg text-lg font-medium hover:bg-accent-soft"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                      Nota para cocina (opcional)
                      <input
                        value={notasLinea}
                        onChange={(e) => setNotasLinea(e.target.value)}
                        placeholder="Sin cebolla, extra queso…"
                        className="rounded-xl border border-line bg-background px-3 py-2.5 text-base font-normal"
                      />
                    </label>
                  </div>

                  {productoSel ? (
                    <p className="rounded-xl bg-olive-soft/60 px-4 py-2.5 text-sm text-foreground">
                      Vas a agregar{" "}
                      <strong>{textoCantidad(Number(cantidad) || 0)}</strong>{" "}
                      de <strong>{productoSel.nombre}</strong> (
                      {dinero(productoSel.precio)} c/u).
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled={!puedeOperar || enviando || !productoId}
                    onClick={() => void agregar()}
                    className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50 sm:w-auto sm:px-6"
                  >
                    {enviando ? "Agregando…" : "Agregar al carrito"}
                  </button>

                  <div className="rounded-2xl border border-line bg-background/60 p-4">
                    <h3 className="text-base font-semibold">Cobrar venta</h3>
                    <p className="mt-1 text-sm text-muted">
                      Al confirmar, se registra el pago y baja el inventario.
                    </p>
                    <div
                      className="mt-4 grid gap-2 sm:grid-cols-3"
                      role="group"
                      aria-label="Método de pago"
                    >
                      {METODOS.map((opcion) => (
                        <button
                          key={opcion.id}
                          type="button"
                          aria-pressed={metodo === opcion.id}
                          onClick={() => setMetodo(opcion.id)}
                          className={`flex flex-col items-start rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                            metodo === opcion.id
                              ? "border-accent bg-accent-soft"
                              : "border-line bg-card hover:border-accent/40"
                          }`}
                        >
                          <span className="font-semibold">{opcion.titulo}</span>
                          <span className="text-xs text-muted">
                            {opcion.detalle}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        disabled={
                          !puedeOperar ||
                          enviando ||
                          venta.lineasDetalle.length === 0
                        }
                        onClick={() => void cobrar()}
                        className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {enviando
                          ? "Procesando…"
                          : `Cobrar ${dinero(venta.total)}`}
                      </button>
                      <button
                        type="button"
                        disabled={!puedeOperar || enviando}
                        onClick={() => void cancelarAbierta()}
                        className="rounded-xl border border-line px-5 py-3 text-sm font-medium text-muted hover:bg-card disabled:opacity-50"
                      >
                        Cancelar sin cobrar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {venta.estado === "cobrada" ? (
                <div className="border-t border-line px-5 py-5">
                  <h3 className="text-base font-semibold">Devolver venta</h3>
                  <p className="mt-1 text-sm text-muted">
                    Solo ventas cobradas. Se registra la cancelación y el stock
                    vuelve al inventario.
                  </p>
                  <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
                    ¿Por qué se cancela?
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Cliente equivocado, error en cocina…"
                      className="rounded-xl border border-line bg-background px-3 py-2.5 text-base font-normal"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!puedeOperar || enviando}
                    onClick={() => void cancelarCobrada()}
                    className="mt-4 rounded-xl border border-danger/40 bg-danger-soft px-5 py-2.5 text-sm font-semibold text-danger disabled:opacity-50"
                  >
                    Cancelar y devolver existencia
                  </button>
                </div>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}