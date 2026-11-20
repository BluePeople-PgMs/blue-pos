"use client";

import { useEffect, useMemo, useState } from "react";
import {
  leerInventario,
  registrarEntrada,
  type CajaInventario,
  type MovimientoReciente,
  type ProductoInventario,
  type TipoMovimientoInventario,
} from "@/lib/inventario";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function textoCantidad(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 3,
  }).format(valor);
}

function etiquetaTipo(tipo: string) {
  if (tipo === "insumo") return "Insumo";
  if (tipo === "directo") return "Empacado";
  return tipo;
}

function etiquetaMovimiento(tipo: TipoMovimientoInventario) {
  if (tipo === "entrada") {
    return { texto: "Entrada", signo: "+" as const, icono: "↑" as const };
  }
  if (tipo === "salida_venta") {
    return { texto: "Salida venta", signo: "−" as const, icono: "↓" as const };
  }
  return { texto: "Cancelación", signo: "+" as const, icono: "↺" as const };
}

export function InventarioVista() {
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [puedeCapturar, setPuedeCapturar] = useState(false);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [cajas, setCajas] = useState<CajaInventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoReciente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [origen, setOrigen] = useState("Todos");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [cajaId, setCajaId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function cargar() {
    const datos = await leerInventario();
    setAviso(datos.error);
    setPuedeCapturar(datos.sesion);
    setProductos(datos.productos);
    setCajas(datos.cajas);
    setMovimientos(datos.movimientos);
    setCargando(false);
  }

  useEffect(() => {
    let activo = true;
    leerInventario().then((datos) => {
      if (!activo) return;
      setAviso(datos.error);
      setPuedeCapturar(datos.sesion);
      setProductos(datos.productos);
      setCajas(datos.cajas);
      setMovimientos(datos.movimientos);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  const categorias = useMemo(() => {
    const orden = new Map<string, number>();
    for (const producto of productos) {
      if (!orden.has(producto.categoria)) {
        orden.set(producto.categoria, producto.orden);
      }
    }
    return [...orden.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([nombre]) => nombre);
  }, [productos]);

  const visibles = useMemo(() => {
    const consulta = normalizar(busqueda.trim());
    return productos.filter((producto) => {
      if (origen === "Insumos" && producto.tipo !== "insumo") return false;
      if (origen === "Empacados" && producto.tipo !== "directo") return false;
      if (categoria !== "Todas" && producto.categoria !== categoria) return false;
      if (!consulta) return true;
      return (
        normalizar(producto.nombre).includes(consulta) ||
        normalizar(producto.codigo).includes(consulta)
      );
    });
  }, [productos, busqueda, categoria, origen]);

  const seleccionado = productos.find((producto) => producto.id === productoId);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setResultado(null);
    const numero = Number(cantidad);
    if (!productoId) {
      setResultado("Elige un producto del catálogo.");
      return;
    }
    if (!(numero > 0)) {
      setResultado("La cantidad tiene que ser mayor a cero.");
      return;
    }

    setEnviando(true);
    const { error } = await registrarEntrada({
      productoId,
      cantidad: numero,
      nota,
      cajaId: cajaId || null,
    });
    setEnviando(false);
    if (error) {
      setResultado(error);
      return;
    }
    setCantidad("");
    setNota("");
    setResultado("Entrada registrada. La existencia ya sumó esa cantidad.");
    setCargando(true);
    await cargar();
  }

  if (cargando && productos.length === 0) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Cargando el catálogo…
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

      <form
        onSubmit={guardar}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5"
      >
        <div>
          <h2 className="text-lg font-semibold">Nueva entrada</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Suma existencia de un insumo o producto empacado. Las comidas
            preparadas no llevan fila aquí: su stock son los ingredientes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Producto
            <select
              value={productoId}
              onChange={(evento) => setProductoId(evento.target.value)}
              className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
            >
              <option value="">Elige del catálogo</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                  {producto.codigo ? ` · ${producto.codigo}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Cantidad
            <input
              value={cantidad}
              onChange={(evento) => setCantidad(evento.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Caja
            <select
              value={cajaId}
              onChange={(evento) => setCajaId(evento.target.value)}
              className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
            >
              <option value="">Sin caja</option>
              {cajas.map((caja) => (
                <option key={caja.id} value={caja.id}>
                  {caja.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Nota
            <input
              value={nota}
              onChange={(evento) => setNota(evento.target.value)}
              placeholder="Opcional"
              className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
            />
          </label>
        </div>
        {seleccionado ? (
          <p className="text-sm text-muted">
            {etiquetaTipo(seleccionado.tipo)} · {seleccionado.categoria}
            {seleccionado.unidad ? ` · ${seleccionado.unidad}` : ""}
            {seleccionado.existencia === null
              ? ""
              : ` · existencia ${textoCantidad(seleccionado.existencia)}`}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!puedeCapturar || enviando}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {enviando ? "Guardando…" : "Registrar entrada"}
          </button>
          {resultado ? (
            <p role="status" className="text-sm text-muted">
              {resultado}
            </p>
          ) : null}
        </div>
      </form>

      {movimientos.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Movimientos recientes</h2>
          <p className="text-sm text-muted">
            Entradas suman existencia; cobros restan; cancelaciones devuelven.
          </p>
          <ul className="flex flex-col gap-2">
            {movimientos.map((movimiento) => {
              const { texto, signo, icono } = etiquetaMovimiento(movimiento.tipo);
              return (
                <li
                  key={movimiento.id}
                  className="flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <span
                      className="mr-1.5 inline-flex size-6 items-center justify-center rounded-full bg-background font-semibold text-accent ring-1 ring-line"
                      aria-hidden
                    >
                      {icono}
                    </span>
                    <span className="font-medium text-foreground">{texto}</span>
                    <span className="text-muted"> · {movimiento.producto}</span>
                    {movimiento.folioVenta ? (
                      <span className="text-muted">
                        {" "}
                        · folio {movimiento.folioVenta}
                      </span>
                    ) : null}
                    {movimiento.nota ? (
                      <span className="text-muted"> · {movimiento.nota}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {signo}
                    {textoCantidad(movimiento.cantidad)}
                    {movimiento.unidad ? ` ${movimiento.unidad}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
            Buscar en el catálogo
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Nombre o código"
              className="rounded-xl border border-line bg-card px-3 py-2 text-base font-normal outline-none focus:border-accent"
            />
          </label>
          <p className="text-sm text-muted">
            {visibles.length} de {productos.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Origen">
          {["Todos", "Insumos", "Empacados"].map((nombre) => (
            <button
              key={nombre}
              type="button"
              aria-pressed={origen === nombre}
              onClick={() => setOrigen(nombre)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                origen === nombre
                  ? "bg-accent text-white"
                  : "bg-card text-muted ring-1 ring-line"
              }`}
            >
              {nombre}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
          {["Todas", ...categorias].map((nombre) => (
            <button
              key={nombre}
              type="button"
              aria-pressed={categoria === nombre}
              onClick={() => setCategoria(nombre)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                categoria === nombre
                  ? "bg-foreground text-background"
                  : "bg-card text-muted ring-1 ring-line"
              }`}
            >
              {nombre}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted">
            Ningún producto del catálogo coincide.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visibles.map((producto) => {
              const activo = producto.id === productoId;
              return (
                <li key={producto.id}>
                  <button
                    type="button"
                    onClick={() => setProductoId(producto.id)}
                    className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left ${
                      activo
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-card"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium leading-6">
                        {producto.nombre}
                      </span>
                      <span className="mt-1 block font-mono text-xs text-muted">
                        {producto.codigo || etiquetaTipo(producto.tipo)}
                        {producto.unidad ? ` · ${producto.unidad}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold">
                        {producto.existencia === null
                          ? "—"
                          : textoCantidad(producto.existencia)}
                      </span>
                      <span className="text-xs text-muted">existencia</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
