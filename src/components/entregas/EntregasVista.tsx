"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductoVenta } from "@/lib/ventas";
import {
  ACCION_SIGUIENTE,
  avanzarEstadoEntrega,
  crearEntregaRecibida,
  ETIQUETAS_ESTADO,
  leerEntrega,
  listarEntregas,
  ORDEN_ESTADOS,
  productosParaEntrega,
  type EntregaLista,
  type EstadoEntrega,
  type LineaEntrega,
} from "@/lib/entregas";

type LineaBorrador = {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

type Mensaje = { texto: string; tono: "ok" | "error" };

const METODOS = [
  { id: "efectivo", etiqueta: "Efectivo" },
  { id: "tarjeta", etiqueta: "Tarjeta" },
  { id: "transferencia", etiqueta: "Transferencia" },
] as const;

export function EntregasVista() {
  const [entregas, setEntregas] = useState<EntregaLista[]>([]);
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null);

  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [metodo, setMetodo] = useState<(typeof METODOS)[number]["id"]>("efectivo");
  const [lineasBorrador, setLineasBorrador] = useState<LineaBorrador[]>([]);
  const [productoSel, setProductoSel] = useState("");
  const [cantidadSel, setCantidadSel] = useState(1);

  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalleLineas, setDetalleLineas] = useState<LineaEntrega[]>([]);
  const [repartidorModal, setRepartidorModal] = useState<string | null>(null);
  const [repartidorNombre, setRepartidorNombre] = useState("");

  const publicar = useCallback((texto: string, tono: Mensaje["tono"]) => {
    setMensaje({ texto, tono });
  }, []);

  const recargar = useCallback(async () => {
    const [lista, cat] = await Promise.all([listarEntregas(), productosParaEntrega()]);
    if (lista.error) publicar(lista.error, "error");
    else setEntregas(lista.entregas);
    if (cat.error) publicar(cat.error, "error");
    else setProductos(cat.productos);
    setCargando(false);
  }, [publicar]);

  useEffect(() => {
    let activo = true;
    void (async () => {
      const [lista, cat] = await Promise.all([
        listarEntregas(),
        productosParaEntrega(),
      ]);
      if (!activo) return;
      if (lista.error) publicar(lista.error, "error");
      else setEntregas(lista.entregas);
      if (cat.error) publicar(cat.error, "error");
      else setProductos(cat.productos);
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, [publicar]);

  const entregasPorEstado = useMemo(() => {
    const mapa = new Map<EstadoEntrega, EntregaLista[]>();
    for (const estado of ORDEN_ESTADOS) {
      mapa.set(estado, []);
    }
    for (const entrega of entregas) {
      const lista = mapa.get(entrega.estado) ?? [];
      lista.push(entrega);
      mapa.set(entrega.estado, lista);
    }
    return mapa;
  }, [entregas]);

  const totalBorrador = lineasBorrador.reduce(
    (s, l) => s + l.cantidad * l.precioUnitario,
    0,
  );

  function agregarLinea() {
    const producto = productos.find((p) => p.id === productoSel);
    if (!producto) {
      publicar("Elige un producto del catálogo.", "error");
      return;
    }
    if (cantidadSel <= 0) {
      publicar("La cantidad debe ser mayor a cero.", "error");
      return;
    }
    setLineasBorrador((prev) => {
      const existente = prev.find((l) => l.productoId === producto.id);
      if (existente) {
        return prev.map((l) =>
          l.productoId === producto.id
            ? { ...l, cantidad: l.cantidad + cantidadSel }
            : l,
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: cantidadSel,
          precioUnitario: producto.precio,
        },
      ];
    });
    setCantidadSel(1);
  }

  function quitarLinea(productoId: string) {
    setLineasBorrador((prev) => prev.filter((l) => l.productoId !== productoId));
  }

  function rellenarPrueba() {
    const muestra = productos.slice(0, 3);
    if (muestra.length === 0) {
      publicar("No hay productos en catálogo. Corre npm run sembrar:catalogo.", "error");
      return;
    }
    setCliente("María Rossi");
    setDireccion("Via Roma 42, Col. Centro");
    setTelefono("555-0123");
    setNotas("Tocar timbre azul.");
    setMetodo("efectivo");
    setLineasBorrador(
      muestra.map((p) => ({
        productoId: p.id,
        nombre: p.nombre,
        cantidad: 1,
        precioUnitario: p.precio,
      })),
    );
    setFormAbierto(true);
    publicar("Datos de prueba listos. Revisa y guarda.", "ok");
  }

  async function guardarEntrega() {
    setGuardando(true);
    const resultado = await crearEntregaRecibida({
      clienteNombre: cliente,
      direccion,
      telefono,
      notas,
      metodo,
      lineas: lineasBorrador.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        producto: l.nombre,
      })),
    });
    setGuardando(false);
    if (resultado.error) {
      publicar(resultado.error, "error");
      return;
    }
    publicar("Pedido recibido y cobrado. Aparece en cocina.", "ok");
    setFormAbierto(false);
    setCliente("");
    setDireccion("");
    setTelefono("");
    setNotas("");
    setLineasBorrador([]);
    await recargar();
  }

  async function verDetalle(id: string) {
    if (detalleId === id) {
      setDetalleId(null);
      setDetalleLineas([]);
      return;
    }
    const { error, entrega } = await leerEntrega(id);
    if (error || !entrega) {
      publicar(error ?? "No se pudo leer el pedido.", "error");
      return;
    }
    setDetalleId(id);
    setDetalleLineas(entrega.lineasDetalle);
  }

  async function confirmarAvance(entregaId: string, repartidor?: string) {
    setAvanzandoId(entregaId);
    const { error } = await avanzarEstadoEntrega(entregaId, { repartidor });
    setAvanzandoId(null);
    if (error) {
      publicar(error, "error");
      return;
    }
    setRepartidorModal(null);
    setRepartidorNombre("");
    publicar("Estado actualizado.", "ok");
    if (detalleId === entregaId) {
      setDetalleId(null);
    }
    await recargar();
  }

  function iniciarAvance(entrega: EntregaLista) {
    if (entrega.estado === "listo_para_recoger") {
      setRepartidorModal(entrega.id);
      setRepartidorNombre(entrega.repartidor ?? "");
      return;
    }
    confirmarAvance(entrega.id);
  }

  if (cargando) {
    return (
      <p className="text-sm text-muted" role="status">
        Cargando entregas…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Recibe el pedido (cobra e inventario), avanza por cocina y reparto hasta
          entregado.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold hover:bg-line/40"
            onClick={rellenarPrueba}
          >
            Pedido de prueba
          </button>
          <button
            type="button"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            onClick={() => setFormAbierto((v) => !v)}
          >
            {formAbierto ? "Cerrar formulario" : "Recibir pedido"}
          </button>
        </div>
      </div>

      {mensaje ? (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            mensaje.tono === "ok"
              ? "border-olive/30 bg-olive-soft text-olive"
              : "border-danger/30 bg-danger-soft text-danger"
          }`}
        >
          {mensaje.texto}
        </div>
      ) : null}

      {formAbierto ? (
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-lg font-semibold">Nuevo pedido a domicilio</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Cliente
              <input
                className="rounded-xl border border-line bg-background px-3 py-2"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Teléfono (opcional)
              <input
                className="rounded-xl border border-line bg-background px-3 py-2"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Dirección
              <input
                className="rounded-xl border border-line bg-background px-3 py-2"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Método de pago
              <select
                className="rounded-xl border border-line bg-background px-3 py-2"
                value={metodo}
                onChange={(e) =>
                  setMetodo(e.target.value as (typeof METODOS)[number]["id"])
                }
              >
                {METODOS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Notas (opcional)
              <input
                className="rounded-xl border border-line bg-background px-3 py-2"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <h3 className="text-sm font-semibold">Productos</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                className="min-w-[12rem] flex-1 rounded-xl border border-line bg-background px-3 py-2 text-sm"
                value={productoSel}
                onChange={(e) => setProductoSel(e.target.value)}
              >
                <option value="">Elige producto…</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — ${p.precio.toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0.001}
                step={1}
                className="w-24 rounded-xl border border-line bg-background px-3 py-2 text-sm"
                value={cantidadSel}
                onChange={(e) => setCantidadSel(Number(e.target.value))}
              />
              <button
                type="button"
                className="rounded-xl border border-line px-4 py-2 text-sm font-semibold"
                onClick={agregarLinea}
              >
                Agregar
              </button>
            </div>

            {lineasBorrador.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {lineasBorrador.map((l) => (
                  <li
                    key={l.productoId}
                    className="flex items-center justify-between rounded-xl bg-background px-3 py-2"
                  >
                    <span>
                      {l.nombre} × {l.cantidad} — $
                      {(l.cantidad * l.precioUnitario).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      className="text-danger text-xs font-semibold"
                      onClick={() => quitarLinea(l.productoId)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="mt-3 text-sm font-semibold">
              Total: ${totalBorrador.toFixed(2)}
            </p>

            <button
              type="button"
              disabled={guardando}
              className="mt-4 rounded-xl bg-olive px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              onClick={guardarEntrega}
            >
              {guardando ? "Guardando…" : "Recibir y cobrar"}
            </button>
          </div>
        </section>
      ) : null}

      {repartidorModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-labelledby="repartidor-titulo"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-lg">
            <h2 id="repartidor-titulo" className="text-lg font-semibold">
              Repartidor
            </h2>
            <p className="mt-1 text-sm text-muted">
              Quien recoge el pedido en el local.
            </p>
            <input
              className="mt-4 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm"
              value={repartidorNombre}
              onChange={(e) => setRepartidorNombre(e.target.value)}
              placeholder="Nombre del repartidor"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-line px-4 py-2 text-sm font-semibold"
                onClick={() => setRepartidorModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
                onClick={() =>
                  confirmarAvance(repartidorModal, repartidorNombre)
                }
              >
                En camino
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5">
        {ORDEN_ESTADOS.map((estado) => {
          const tarjetas = entregasPorEstado.get(estado) ?? [];
          return (
            <section
              key={estado}
              className="flex min-h-[12rem] flex-col rounded-2xl border border-line bg-card/60 p-3"
              aria-label={ETIQUETAS_ESTADO[estado]}
            >
              <header className="mb-2 border-b border-line pb-2">
                <h2 className="text-sm font-semibold">
                  {ETIQUETAS_ESTADO[estado]}
                </h2>
                <p className="text-xs text-muted">{tarjetas.length} pedidos</p>
              </header>
              <ul className="flex flex-1 flex-col gap-2">
                {tarjetas.map((entrega) => (
                  <li
                    key={entrega.id}
                    className="rounded-xl border border-line bg-card p-3 text-sm"
                  >
                    <p className="font-semibold">{entrega.clienteNombre}</p>
                    <p className="text-xs text-muted">
                      {entrega.folio ?? entrega.id.slice(0, 8)} · $
                      {entrega.total.toFixed(2)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs">{entrega.direccion}</p>
                    {entrega.repartidor ? (
                      <p className="mt-1 text-xs text-muted">
                        Reparto: {entrega.repartidor}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-accent underline"
                        onClick={() => verDetalle(entrega.id)}
                      >
                        {detalleId === entrega.id ? "Ocultar" : "Detalle"}
                      </button>
                      {ACCION_SIGUIENTE[entrega.estado] ? (
                        <button
                          type="button"
                          disabled={avanzandoId === entrega.id}
                          className="rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-accent disabled:opacity-50"
                          onClick={() => iniciarAvance(entrega)}
                        >
                          {ACCION_SIGUIENTE[entrega.estado]}
                        </button>
                      ) : null}
                    </div>
                    {detalleId === entrega.id && detalleLineas.length > 0 ? (
                      <ul className="mt-2 space-y-1 border-t border-line pt-2 text-xs">
                        {detalleLineas.map((l) => (
                          <li key={l.id}>
                            {l.producto} × {l.cantidad}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}