"use client";

import { etiquetaTipoProducto } from "@/lib/catalogo/productos";
import {
  actualizarCantidadInsumo,
  actualizarReceta,
  agregarInsumo,
  crearReceta,
  listarInsumos,
  listarInsumosDisponibles,
  listarProductosPreparado,
  mensajeError,
  obtenerRecetaPorProducto,
  quitarInsumo,
  type ProductoResumen,
  type Receta,
  type RecetaInsumo,
} from "@/lib/recetas";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function RecetasEditor() {
  const [preparados, setPreparados] = useState<ProductoResumen[]>([]);
  const [productoId, setProductoId] = useState("");
  const [receta, setReceta] = useState<Receta | null>(null);
  const [nombreReceta, setNombreReceta] = useState("");
  const [rendimiento, setRendimiento] = useState("1");
  const [insumos, setInsumos] = useState<RecetaInsumo[]>([]);
  const [insumosCatalogo, setInsumosCatalogo] = useState<ProductoResumen[]>([]);
  const [insumoId, setInsumoId] = useState("");
  const [cantidadNueva, setCantidadNueva] = useState("1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cantidadEdit, setCantidadEdit] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preparadoSeleccionado = preparados.find((p) => p.id === productoId);

  const cargarDetalle = useCallback(
    async (
      selectedProductoId: string,
      preparadoNombre?: string,
    ) => {
      if (!selectedProductoId) {
        setReceta(null);
        setInsumos([]);
        setInsumosCatalogo([]);
        return;
      }

      setBusy(true);
      setError(null);

      const recetaRes = await obtenerRecetaPorProducto(selectedProductoId);

      if (recetaRes.error) {
        setError(mensajeError(recetaRes.error));
        setBusy(false);
        return;
      }

      const preparado =
        preparados.find((p) => p.id === selectedProductoId) ??
        (preparadoNombre ? { nombre: preparadoNombre } : null);
      const recetaActual = recetaRes.data;

      if (recetaActual) {
        setReceta(recetaActual);
        setNombreReceta(recetaActual.nombre);
        setRendimiento(String(recetaActual.rendimiento));

        const [insRes, insumosCatRes] = await Promise.all([
          listarInsumos(recetaActual.id),
          listarInsumosDisponibles(recetaActual.id),
        ]);
        setBusy(false);

        if (insRes.error) {
          setError(mensajeError(insRes.error));
          setInsumos([]);
        } else {
          setInsumos(insRes.data ?? []);
        }

        if (insumosCatRes.error) {
          setError((prev) => prev ?? mensajeError(insumosCatRes.error!));
          setInsumosCatalogo([]);
        } else {
          const catalogo = insumosCatRes.data ?? [];
          setInsumosCatalogo(catalogo);
          setInsumoId((prev) =>
            catalogo.some((p) => p.id === prev) ? prev : (catalogo[0]?.id ?? ""),
          );
        }
      } else {
        setReceta(null);
        setInsumos([]);
        setNombreReceta(preparado?.nombre ?? "");
        setRendimiento("1");

        const insumosCatRes = await listarInsumosDisponibles("");
        setBusy(false);

        if (insumosCatRes.error) {
          setError(mensajeError(insumosCatRes.error));
          setInsumosCatalogo([]);
        } else {
          const catalogo = insumosCatRes.data ?? [];
          setInsumosCatalogo(catalogo);
          setInsumoId(catalogo[0]?.id ?? "");
        }
      }
    },
    [preparados],
  );

  useEffect(() => {
    let activo = true;

    void (async () => {
      const { data, error: listError } = await listarProductosPreparado();
      if (!activo) return;
      setLoading(false);
      if (listError) {
        setError(mensajeError(listError));
        setPreparados([]);
        return;
      }
      const lista = data ?? [];
      setPreparados(lista);
      const primero = lista[0]?.id ?? "";
      if (!primero) return;
      setProductoId(primero);
      const prep = lista.find((p) => p.id === primero);
      await cargarDetalle(primero, prep?.nombre);
    })();

    return () => {
      activo = false;
    };
    // La carga inicial no debe repetirse cuando cambia el detalle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPreparadoChange(nextId: string) {
    setProductoId(nextId);
    setEditingId(null);
    void cargarDetalle(nextId);
  }

  async function onCrearReceta() {
    if (!productoId) return;
    const rendimientoNum = Number.parseFloat(rendimiento.replace(",", "."));
    setBusy(true);
    setError(null);
    const { data, error: submitError } = await crearReceta({
      productoId,
      nombre: nombreReceta,
      rendimiento: rendimientoNum,
    });
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    if (data) {
      setReceta(data);
      await cargarDetalle(productoId);
    }
  }

  async function onGuardarCabecera() {
    if (!receta) return;
    const rendimientoNum = Number.parseFloat(rendimiento.replace(",", "."));
    setBusy(true);
    setError(null);
    const { error: submitError } = await actualizarReceta(receta.id, {
      nombre: nombreReceta,
      rendimiento: rendimientoNum,
    });
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    setReceta({
      ...receta,
      nombre: nombreReceta.trim(),
      rendimiento: rendimientoNum,
    });
  }

  async function onAgregar() {
    if (!receta || !insumoId) return;
    const cantidad = Number.parseFloat(cantidadNueva.replace(",", "."));
    setBusy(true);
    setError(null);
    const { error: submitError } = await agregarInsumo({
      recetaId: receta.id,
      insumoId,
      cantidad,
    });
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    setCantidadNueva("1");
    await cargarDetalle(productoId);
  }

  async function onGuardarCantidad(filaId: string) {
    const cantidad = Number.parseFloat(cantidadEdit.replace(",", "."));
    setBusy(true);
    setError(null);
    const { error: submitError } = await actualizarCantidadInsumo(filaId, cantidad);
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    setEditingId(null);
    await cargarDetalle(productoId);
  }

  async function onQuitar(filaId: string) {
    setBusy(true);
    setError(null);
    const { error: submitError } = await quitarInsumo(filaId);
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    await cargarDetalle(productoId);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="preparado" className="text-sm font-medium text-foreground">
          Producto preparado
        </label>
        <select
          id="preparado"
          value={productoId}
          onChange={(e) => onPreparadoChange(e.target.value)}
          disabled={loading || preparados.length === 0}
          className="rounded-xl border border-line bg-background px-4 py-3 text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-60"
        >
          {preparados.length === 0 ? (
            <option value="">Sin productos tipo preparado</option>
          ) : (
            preparados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.codigo ? ` · ${p.codigo}` : ""}
              </option>
            ))
          )}
        </select>
        {preparados.length === 0 && !loading ? (
          <p className="text-sm leading-6 text-muted">
            Crea en el{" "}
            <Link
              href="/catalogos?tipo=preparado"
              className="font-semibold text-accent hover:underline"
            >
              catálogo de productos
            </Link>{" "}
            un artículo con{" "}
            <span className="font-mono text-foreground">tipo = preparado</span>{" "}
            y vuelve aquí para definir su receta.
          </p>
        ) : null}
      </div>

      {preparadoSeleccionado ? (
        <>
          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-background px-5 py-4">
            <h2 className="text-base font-semibold">Cabecera de la receta</h2>
            <p className="text-sm text-muted">
              El rendimiento indica cuántas unidades del preparado produce esta
              fórmula (por defecto 1).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="nombre-receta" className="text-sm font-medium">
                  Nombre
                </label>
                <input
                  id="nombre-receta"
                  type="text"
                  value={nombreReceta}
                  onChange={(e) => setNombreReceta(e.target.value)}
                  disabled={busy}
                  className="rounded-xl border border-line bg-card px-4 py-3 text-sm disabled:opacity-60"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="rendimiento" className="text-sm font-medium">
                  Rendimiento
                </label>
                <input
                  id="rendimiento"
                  type="text"
                  inputMode="decimal"
                  value={rendimiento}
                  onChange={(e) => setRendimiento(e.target.value)}
                  disabled={busy}
                  className="rounded-xl border border-line bg-card px-4 py-3 text-sm disabled:opacity-60"
                />
              </div>
            </div>
            {receta ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onGuardarCabecera()}
                className="w-fit rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Guardar nombre y rendimiento
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onCrearReceta()}
                className="w-fit rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Crear receta para este preparado
              </button>
            )}
          </section>

          {receta ? (
            <>
              <section className="flex flex-col gap-3">
                <h2 className="text-base font-semibold">Insumos</h2>
                {insumos.length === 0 ? (
                  <p className="text-sm text-muted">
                    Esta receta aún no tiene filas en{" "}
                    <span className="font-mono text-foreground">
                      receta_insumos
                    </span>
                    .
                  </p>
                ) : (
                  <ul className="divide-y divide-line rounded-xl border border-line bg-background">
                    {insumos.map((fila) => {
                      const nombre = fila.productos?.nombre ?? "Insumo";
                      const codigo = fila.productos?.codigo;
                      const editando = editingId === fila.id;

                      return (
                        <li
                          key={fila.id}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {nombre}
                            </p>
                            <p className="text-xs text-muted">
                              {fila.productos?.tipo ? (
                                <span className="mr-2 rounded bg-background px-1.5 py-0.5">
                                  {etiquetaTipoProducto(fila.productos.tipo)}
                                </span>
                              ) : null}
                              {codigo ? (
                                <span className="font-mono">{codigo}</span>
                              ) : null}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {editando ? (
                              <>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={cantidadEdit}
                                  onChange={(e) =>
                                    setCantidadEdit(e.target.value)
                                  }
                                  className="w-24 rounded-lg border border-line px-2 py-1.5 text-sm"
                                  aria-label="Nueva cantidad"
                                />
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void onGuardarCantidad(fila.id)}
                                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-muted">
                                  Cantidad:{" "}
                                  <span className="font-mono text-foreground">
                                    {fila.cantidad}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => {
                                    setEditingId(fila.id);
                                    setCantidadEdit(String(fila.cantidad));
                                  }}
                                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-60"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void onQuitar(fila.id)}
                                  className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger disabled:opacity-60"
                                >
                                  Quitar
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-3 border-t border-line pt-6">
                <h2 className="text-base font-semibold">Agregar insumo</h2>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="insumo-select"
                      className="text-sm font-medium text-foreground"
                    >
                      Insumo
                    </label>
                    <select
                      id="insumo-select"
                      value={insumoId}
                      onChange={(e) => setInsumoId(e.target.value)}
                      disabled={busy || insumosCatalogo.length === 0}
                      className="rounded-xl border border-line bg-background px-4 py-3 text-sm disabled:opacity-60"
                    >
                      {insumosCatalogo.length === 0 ? (
                        <option value="">
                          Sin insumos disponibles en catálogo
                        </option>
                      ) : (
                        insumosCatalogo.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                            {p.codigo ? ` · ${p.codigo}` : ""}
                          </option>
                        ))
                      )}
                    </select>
                    {insumosCatalogo.length === 0 ? (
                      <p className="text-xs text-muted">
                        <Link
                          href="/catalogos?tipo=insumo"
                          className="font-semibold text-accent hover:underline"
                        >
                          Alta de insumos
                        </Link>{" "}
                        en el catálogo.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="cantidad-insumo"
                      className="text-sm font-medium text-foreground"
                    >
                      Cantidad
                    </label>
                    <input
                      id="cantidad-insumo"
                      type="text"
                      inputMode="decimal"
                      value={cantidadNueva}
                      onChange={(e) => setCantidadNueva(e.target.value)}
                      className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm sm:w-28"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy || !insumoId || insumosCatalogo.length === 0}
                    onClick={() => void onAgregar()}
                    className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {busy && !loading ? (
        <p className="text-sm text-muted" role="status">
          Actualizando…
        </p>
      ) : null}
    </div>
  );
}