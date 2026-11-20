"use client";

import { useEffect, useMemo, useState } from "react";
import {
  agregarInsumoReceta,
  crearReceta,
  leerRecetas,
  quitarInsumoReceta,
  type RecetaDetalle,
} from "@/lib/recetas";

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

export function RecetasVista() {
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [recetas, setRecetas] = useState<RecetaDetalle[]>([]);
  const [preparados, setPreparados] = useState<
    { id: string; nombre: string; codigo: string }[]
  >([]);
  const [insumos, setInsumos] = useState<
    { id: string; nombre: string; codigo: string; unidad: string }[]
  >([]);
  const [busqueda, setBusqueda] = useState("");
  const [recetaId, setRecetaId] = useState("");

  const [nuevoProductoId, setNuevoProductoId] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoRendimiento, setNuevoRendimiento] = useState("1");
  const [creando, setCreando] = useState(false);
  const [mensajeCrear, setMensajeCrear] = useState<string | null>(null);

  const [insumoId, setInsumoId] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [mensajeLinea, setMensajeLinea] = useState<string | null>(null);
  const [quitandoId, setQuitandoId] = useState<string | null>(null);

  async function cargar() {
    const datos = await leerRecetas();
    setAviso(datos.error);
    setRecetas(datos.recetas);
    setPreparados(datos.preparados);
    setInsumos(datos.insumos);
    setCargando(false);
  }

  useEffect(() => {
    let activo = true;
    leerRecetas().then((datos) => {
      if (!activo) return;
      setAviso(datos.error);
      setRecetas(datos.recetas);
      setPreparados(datos.preparados);
      setInsumos(datos.insumos);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  const visibles = useMemo(() => {
    const consulta = normalizar(busqueda.trim());
    if (!consulta) return recetas;
    return recetas.filter(
      (receta) =>
        normalizar(receta.nombre).includes(consulta) ||
        normalizar(receta.productoNombre).includes(consulta),
    );
  }, [recetas, busqueda]);

  const seleccionada = recetas.find((receta) => receta.id === recetaId);

  useEffect(() => {
    if (!nuevoProductoId) return;
    const preparado = preparados.find((p) => p.id === nuevoProductoId);
    if (preparado && !nuevoNombre.trim()) {
      setNuevoNombre(`Receta · ${preparado.nombre}`);
    }
  }, [nuevoProductoId, preparados, nuevoNombre]);

  async function guardarReceta(evento: React.FormEvent) {
    evento.preventDefault();
    setMensajeCrear(null);
    const rendimiento = Number(nuevoRendimiento);
    setCreando(true);
    const { error, id } = await crearReceta({
      productoId: nuevoProductoId,
      nombre: nuevoNombre,
      rendimiento,
    });
    setCreando(false);
    if (error) {
      setMensajeCrear(error);
      return;
    }
    setMensajeCrear("Receta creada en la tabla recetas.");
    setNuevoProductoId("");
    setNuevoNombre("");
    setNuevoRendimiento("1");
    setCargando(true);
    await cargar();
    if (id) setRecetaId(id);
  }

  async function guardarInsumo(evento: React.FormEvent) {
    evento.preventDefault();
    setMensajeLinea(null);
    if (!recetaId) {
      setMensajeLinea("Elige una receta de la lista.");
      return;
    }
    const cantidad = Number(cantidadInsumo);
    setAgregando(true);
    const { error } = await agregarInsumoReceta({
      recetaId,
      insumoId,
      cantidad,
    });
    setAgregando(false);
    if (error) {
      setMensajeLinea(error);
      return;
    }
    setCantidadInsumo("");
    setInsumoId("");
    setMensajeLinea("Insumo guardado en receta_insumos.");
    setCargando(true);
    await cargar();
  }

  async function quitarLinea(lineaId: string) {
    setMensajeLinea(null);
    setQuitandoId(lineaId);
    const { error } = await quitarInsumoReceta(lineaId);
    setQuitandoId(null);
    if (error) {
      setMensajeLinea(error);
      return;
    }
    setCargando(true);
    await cargar();
  }

  if (cargando && recetas.length === 0) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Cargando recetas…
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

      <section className="rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-lg font-semibold">Cómo se relacionan las tablas</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Cada fila en <span className="font-mono text-foreground">recetas</span>{" "}
          describe una comida preparada del catálogo (
          <span className="font-mono">productos</span> con tipo{" "}
          <span className="font-mono">preparado</span>) y su rendimiento. Las
          líneas en{" "}
          <span className="font-mono text-foreground">receta_insumos</span>{" "}
          ligan esa receta con insumos del catálogo (productos con tipo{" "}
          <span className="font-mono">insumo</span>) y la cantidad usada.
        </p>
        {insumos.length === 0 ? (
          <p className="mt-3 text-sm text-warn">
            Aún no hay productos tipo insumo en el catálogo. El equipo puede
            agregarlos en{" "}
            <span className="font-mono">productos</span> con{" "}
            <span className="font-mono">tipo = &apos;insumo&apos;</span> antes de
            armar recetas.
          </p>
        ) : null}
      </section>

      <form
        onSubmit={guardarReceta}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5"
      >
        <div>
          <h2 className="text-lg font-semibold">Nueva receta</h2>
          <p className="mt-1 text-sm text-muted">
            Inserta en la tabla recetas y liga el producto preparado.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Comida preparada
            <select
              value={nuevoProductoId}
              onChange={(evento) => setNuevoProductoId(evento.target.value)}
              className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
            >
              <option value="">Elige del catálogo</option>
              {preparados.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                  {producto.codigo ? ` · ${producto.codigo}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Nombre de la receta
            <input
              value={nuevoNombre}
              onChange={(evento) => setNuevoNombre(evento.target.value)}
              placeholder="Ej. Receta · Pizza margarita"
              className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Rendimiento (porciones)
            <input
              value={nuevoRendimiento}
              onChange={(evento) => setNuevoRendimiento(evento.target.value)}
              inputMode="decimal"
              className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={creando || preparados.length === 0}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {creando ? "Guardando…" : "Crear receta"}
          </button>
          {mensajeCrear ? (
            <p role="status" className="text-sm text-muted">
              {mensajeCrear}
            </p>
          ) : null}
        </div>
      </form>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
              Buscar receta
              <input
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Nombre o comida"
                className="rounded-xl border border-line bg-card px-3 py-2 text-base font-normal"
              />
            </label>
            <p className="text-sm text-muted">
              {visibles.length} de {recetas.length}
            </p>
          </div>
          {visibles.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted">
              No hay recetas todavía. Crea la primera arriba.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibles.map((receta) => {
                const activa = receta.id === recetaId;
                return (
                  <li key={receta.id}>
                    <button
                      type="button"
                      onClick={() => setRecetaId(receta.id)}
                      className={`flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left ${
                        activa
                          ? "border-accent bg-accent-soft"
                          : "border-line bg-card"
                      }`}
                    >
                      <span className="font-medium">{receta.nombre}</span>
                      <span className="text-sm text-muted">
                        {receta.productoNombre} · rendimiento{" "}
                        {textoCantidad(receta.rendimiento)} ·{" "}
                        {receta.lineas.length} insumo
                        {receta.lineas.length === 1 ? "" : "s"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          {seleccionada ? (
            <>
              <header className="rounded-2xl border border-line bg-card px-5 py-4">
                <h2 className="text-lg font-semibold">{seleccionada.nombre}</h2>
                <p className="mt-1 text-sm text-muted">
                  Comida: {seleccionada.productoNombre} · rendimiento{" "}
                  {textoCantidad(seleccionada.rendimiento)}
                </p>
              </header>

              <div className="overflow-x-auto rounded-2xl border border-line bg-card">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th className="px-4 py-3 font-medium">Insumo</th>
                      <th className="px-4 py-3 font-medium">Cantidad</th>
                      <th className="px-4 py-3 font-medium w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {seleccionada.lineas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-muted"
                        >
                          Sin filas en receta_insumos. Agrega insumos abajo.
                        </td>
                      </tr>
                    ) : (
                      seleccionada.lineas.map((linea) => (
                        <tr
                          key={linea.id}
                          className="border-b border-line last:border-0"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium">
                              {linea.insumoNombre}
                            </span>
                            {linea.insumoCodigo ? (
                              <span className="ml-2 font-mono text-xs text-muted">
                                {linea.insumoCodigo}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            {textoCantidad(linea.cantidad)}
                            {linea.unidad ? ` ${linea.unidad}` : ""}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              disabled={quitandoId === linea.id}
                              onClick={() => quitarLinea(linea.id)}
                              className="text-sm font-medium text-muted hover:text-foreground disabled:opacity-50"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <form
                onSubmit={guardarInsumo}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5"
              >
                <h3 className="text-base font-semibold">Agregar insumo</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
                    Insumo (productos.tipo = insumo)
                    <select
                      value={insumoId}
                      onChange={(evento) => setInsumoId(evento.target.value)}
                      className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
                      disabled={insumos.length === 0}
                    >
                      <option value="">Elige insumo</option>
                      {insumos.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.nombre}
                          {insumo.unidad ? ` · ${insumo.unidad}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium">
                    Cantidad
                    <input
                      value={cantidadInsumo}
                      onChange={(evento) =>
                        setCantidadInsumo(evento.target.value)
                      }
                      inputMode="decimal"
                      placeholder="0"
                      className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={agregando || insumos.length === 0}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {agregando ? "Guardando…" : "Agregar a receta_insumos"}
                  </button>
                  {mensajeLinea ? (
                    <p role="status" className="text-sm text-muted">
                      {mensajeLinea}
                    </p>
                  ) : null}
                </div>
              </form>
            </>
          ) : (
            <p className="rounded-2xl border border-line bg-card px-5 py-8 text-center text-sm text-muted">
              Elige una receta para ver y editar su catálogo de insumos.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}