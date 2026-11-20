"use client";

import { useCallback, useEffect, useState } from "react";
import {
  agregarLinea,
  cancelarVentaAbierta,
  cancelarVentaCobrada,
  cobrarVenta,
  crearVentaAbierta,
  esMetodoPago,
  leerCatalogoVentas,
  leerVenta,
  listarVentas,
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

function etiquetaEstado(estado: VentaLista["estado"]) {
  if (estado === "abierta") return "Abierta";
  if (estado === "cobrada") return "Cobrada";
  return "Cancelada";
}

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

  async function seleccionarVenta(id: string) {
    setVentaId(id);
    await cargarVenta(id);
  }

  const productoSel = productos.find((p) => p.id === productoId);

  async function nuevaVenta() {
    setMensaje(null);
    setEnviando(true);
    const { error, ventaId: id } = await crearVentaAbierta(null);
    setEnviando(false);
    if (error || !id) {
      setMensaje(error ?? "No se creó la venta.");
      return;
    }
    await recargar();
    await seleccionarVenta(id);
    setMensaje("Venta abierta creada. Agrega líneas del catálogo.");
  }

  async function agregar() {
    if (!ventaId) return;
    setMensaje(null);
    const numero = Number(cantidad);
    if (!productoId || !(numero > 0)) {
      setMensaje("Elige un producto y una cantidad mayor a cero.");
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
      setMensaje(error);
      return;
    }
    setNotasLinea("");
    await recargar();
    await cargarVenta(ventaId);
    setMensaje("Línea agregada.");
  }

  async function cobrar() {
    if (!ventaId) return;
    setMensaje(null);
    setEnviando(true);
    const { error } = await cobrarVenta({ ventaId, metodo });
    setEnviando(false);
    if (error) {
      setMensaje(error);
      return;
    }
    await recargar();
    await cargarVenta(ventaId);
    setMensaje("Venta cobrada. El inventario ya restó las existencias.");
  }

  async function cancelarAbierta() {
    if (!ventaId) return;
    setMensaje(null);
    setEnviando(true);
    const { error } = await cancelarVentaAbierta(ventaId);
    setEnviando(false);
    if (error) {
      setMensaje(error);
      return;
    }
    await recargar();
    await cargarVenta(ventaId);
    setMensaje("Venta abierta cancelada. No hubo movimiento de inventario.");
  }

  async function cancelarCobrada() {
    if (!ventaId) return;
    setMensaje(null);
    setEnviando(true);
    const { error } = await cancelarVentaCobrada({
      ventaId,
      motivo: motivo,
    });
    setEnviando(false);
    if (error) {
      setMensaje(error);
      return;
    }
    setMotivo("");
    await recargar();
    await cargarVenta(ventaId);
    setMensaje("Venta cancelada. La existencia se devolvió.");
  }

  if (cargando) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Cargando ventas…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {aviso ? (
        <p
          role="status"
          className="rounded-2xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-warn"
        >
          {aviso}
        </p>
      ) : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Ventas recientes</h2>
          <button
            type="button"
            disabled={!puedeOperar || enviando}
            onClick={() => void nuevaVenta()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Nueva venta abierta
          </button>
        </div>
        {ventas.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay ventas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ventas.map((v) => {
              const activa = v.id === ventaId;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => void seleccionarVenta(v.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                      activa
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-background"
                    }`}
                  >
                    <span>
                      <span className="font-medium">
                        {v.folio ?? v.id.slice(0, 8)}
                      </span>
                      <span className="text-muted"> · {etiquetaEstado(v.estado)}</span>
                      <span className="text-muted">
                        {" "}
                        · {v.lineas} línea{v.lineas === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold">
                      {dinero(v.total)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {venta ? (
        <section className="flex flex-col gap-6 rounded-2xl border border-line bg-card px-5 py-5">
          <header className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">
              {venta.folio ?? "Sin folio"}
            </h2>
            <p className="text-sm text-muted">
              {etiquetaEstado(venta.estado)} · Total {dinero(venta.total)}
            </p>
          </header>

          {venta.lineasDetalle.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {venta.lineasDetalle.map((linea) => (
                <li
                  key={linea.id}
                  className="flex justify-between gap-3 rounded-xl border border-line bg-background px-4 py-3 text-sm"
                >
                  <span>
                    {linea.cantidad} × {linea.producto}
                    {linea.codigo ? (
                      <span className="font-mono text-xs text-muted">
                        {" "}
                        · {linea.codigo}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-medium">
                    {dinero(linea.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Sin líneas todavía.</p>
          )}

          {venta.estado === "abierta" ? (
            <div className="flex flex-col gap-4 border-t border-line pt-4">
              <h3 className="text-base font-semibold">Agregar línea</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
                  Producto
                  <select
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
                  >
                    <option value="">Del catálogo</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                        {p.codigo ? ` · ${p.codigo}` : ""} · existencia{" "}
                        {textoCantidad(p.existencia)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Cantidad
                  <input
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    inputMode="decimal"
                    className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Notas
                  <input
                    value={notasLinea}
                    onChange={(e) => setNotasLinea(e.target.value)}
                    placeholder="Opcional"
                    className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
                  />
                </label>
              </div>
              {productoSel ? (
                <p className="text-sm text-muted">
                  Precio {dinero(productoSel.precio)} · existencia{" "}
                  {textoCantidad(productoSel.existencia)}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!puedeOperar || enviando}
                onClick={() => void agregar()}
                className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                Agregar línea
              </button>

              <div className="flex flex-col gap-3 border-t border-line pt-4">
                <h3 className="text-base font-semibold">Cobrar</h3>
                <label className="flex max-w-xs flex-col gap-1 text-sm font-medium">
                  Método de pago
                  <select
                    value={metodo}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (esMetodoPago(v)) setMetodo(v);
                    }}
                    className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </label>
                <span className="text-sm text-muted">
                  Al cobrar, cada línea genera una salida de inventario.
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!puedeOperar || enviando}
                    onClick={() => void cobrar()}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Cobrar venta
                  </button>
                  <button
                    type="button"
                    disabled={!puedeOperar || enviando}
                    onClick={() => void cancelarAbierta()}
                    className="rounded-full border border-line px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Cancelar sin cobrar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {venta.estado === "cobrada" ? (
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <h3 className="text-base font-semibold">Cancelar venta cobrada</h3>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Motivo
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Por ejemplo: el cliente se fue"
                  className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
                />
              </label>
              <button
                type="button"
                disabled={!puedeOperar || enviando}
                onClick={() => void cancelarCobrada()}
                className="w-fit rounded-full border border-danger/40 bg-danger-soft px-4 py-2 text-sm font-medium text-danger disabled:opacity-50"
              >
                Cancelar y devolver existencia
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-muted">
          Elige una venta de la lista o crea una venta abierta.
        </p>
      )}

      {mensaje ? (
        <p role="status" className="text-sm text-muted">
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}