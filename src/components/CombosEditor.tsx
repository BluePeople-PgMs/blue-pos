"use client";

import {
  descuentoComboPorNumProductos,
  formatoMoneda,
  precioComboConDescuento,
  reglasDescuentoCombo,
} from "@/lib/comboDescuento";
import {
  actualizarCantidad,
  actualizarPrecioCombo,
  agregarComponente,
  listarComponentes,
  listarProductosCombo,
  listarProductosParaComponente,
  mensajeError,
  obtenerPrecioCombo,
  quitarComponente,
  type ComboComponente,
  type ProductoResumen,
} from "@/lib/combos";
import { etiquetaTipoProducto } from "@/lib/catalogo/productos";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function CombosEditor() {
  const [combos, setCombos] = useState<ProductoResumen[]>([]);
  const [comboId, setComboId] = useState("");
  const [componentes, setComponentes] = useState<ComboComponente[]>([]);
  const [productosComponente, setProductosComponente] = useState<ProductoResumen[]>(
    [],
  );
  const [productoId, setProductoId] = useState("");
  const [cantidadNueva, setCantidadNueva] = useState("1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cantidadEdit, setCantidadEdit] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precioCombo, setPrecioCombo] = useState<number | null>(null);

  const cargarDetalle = useCallback(async (selectedComboId: string) => {
    if (!selectedComboId) {
      setComponentes([]);
      setProductosComponente([]);
      return;
    }
    setBusy(true);
    setError(null);
    const [compRes, prodRes, precioRes] = await Promise.all([
      listarComponentes(selectedComboId),
      listarProductosParaComponente(selectedComboId),
      obtenerPrecioCombo(selectedComboId),
    ]);
    setBusy(false);

    if (precioRes.error) {
      setError((prev) => prev ?? mensajeError(precioRes.error!));
    } else {
      setPrecioCombo(precioRes.precio);
    }

    if (compRes.error) {
      setError(mensajeError(compRes.error));
      setComponentes([]);
    } else {
      setComponentes(compRes.data ?? []);
    }

    if (prodRes.error) {
      setError((prev) => prev ?? mensajeError(prodRes.error!));
      setProductosComponente([]);
    } else {
      setProductosComponente(prodRes.data ?? []);
      const disponibles = prodRes.data ?? [];
      setProductoId((prev) =>
        disponibles.some((p) => p.id === prev) ? prev : (disponibles[0]?.id ?? ""),
      );
    }
  }, []);

  useEffect(() => {
    let activo = true;

    void (async () => {
      const { data, error: listError } = await listarProductosCombo();
      if (!activo) return;
      setLoading(false);
      if (listError) {
        setError(mensajeError(listError));
        setCombos([]);
        return;
      }
      const lista = data ?? [];
      setCombos(lista);
      const primero = lista[0]?.id ?? "";
      if (!primero) return;
      setComboId(primero);
      await cargarDetalle(primero);
    })();

    return () => {
      activo = false;
    };
    // La carga inicial no debe repetirse cuando cambia el detalle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onComboChange(nextId: string) {
    setComboId(nextId);
    void cargarDetalle(nextId);
  }

  async function onAgregar() {
    if (!comboId || !productoId) return;
    const cantidad = Number.parseFloat(cantidadNueva.replace(",", "."));
    setBusy(true);
    setError(null);
    const { error: submitError } = await agregarComponente({
      comboId,
      productoId,
      cantidad,
    });
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    setCantidadNueva("1");
    await cargarDetalle(comboId);
  }

  async function onGuardarCantidad(componenteId: string) {
    const cantidad = Number.parseFloat(cantidadEdit.replace(",", "."));
    setBusy(true);
    setError(null);
    const { error: submitError } = await actualizarCantidad(componenteId, cantidad);
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    setEditingId(null);
    await cargarDetalle(comboId);
  }

  async function onQuitar(componenteId: string) {
    setBusy(true);
    setError(null);
    const { error: submitError } = await quitarComponente(componenteId);
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    await cargarDetalle(comboId);
  }

  const comboSeleccionado = combos.find((c) => c.id === comboId);
  const numProductos = componentes.length;
  const descuentoPct = descuentoComboPorNumProductos(numProductos);
  const calculoPrecio = precioComboConDescuento(
    numProductos,
    componentes.map((fila) => ({
      cantidad: fila.cantidad,
      precioUnitario: fila.productos?.precio ?? null,
    })),
  );

  async function onAplicarPrecioSugerido() {
    if (!comboId || !calculoPrecio) return;
    setBusy(true);
    setError(null);
    const { error: submitError } = await actualizarPrecioCombo(
      comboId,
      Math.round(calculoPrecio.total * 100) / 100,
    );
    setBusy(false);
    if (submitError) {
      setError(mensajeError(submitError));
      return;
    }
    setPrecioCombo(Math.round(calculoPrecio.total * 100) / 100);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="combo" className="text-sm font-medium text-foreground">
          Producto combo
        </label>
        <select
          id="combo"
          value={comboId}
          onChange={(e) => onComboChange(e.target.value)}
          disabled={loading || combos.length === 0}
          className="rounded-xl border border-line bg-background px-4 py-3 text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-60"
        >
          {combos.length === 0 ? (
            <option value="">Sin productos tipo combo</option>
          ) : (
            combos.map((combo) => (
              <option key={combo.id} value={combo.id}>
                {combo.nombre}
                {combo.codigo ? ` · ${combo.codigo}` : ""}
                {combo.precio != null ? ` · ${formatoMoneda(combo.precio)}` : ""}
              </option>
            ))
          )}
        </select>
        {combos.length === 0 && !loading ? (
          <p className="text-sm leading-6 text-muted">
            Crea en el{" "}
            <Link
              href="/catalogos?tipo=combo"
              className="font-semibold text-accent hover:underline"
            >
              catálogo de productos
            </Link>{" "}
            un artículo con{" "}
            <span className="font-mono text-foreground">tipo = combo</span> y
            vuelve aquí para armar componentes.
          </p>
        ) : null}
      </div>

      {comboSeleccionado ? (
        <>
          <section
            className="rounded-2xl border border-accent/30 bg-accent-soft px-5 py-4"
            aria-labelledby="descuento-combo-titulo"
          >
            <h2
              id="descuento-combo-titulo"
              className="text-base font-semibold text-accent"
            >
              Descuento por cantidad de productos
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground">
              Este combo incluye{" "}
              <span className="font-semibold">{numProductos}</span>{" "}
              {numProductos === 1 ? "producto" : "productos"} → descuento
              aplicable:{" "}
              <span className="font-semibold">{descuentoPct}%</span>
              {numProductos < 2 ? (
                <span className="text-muted">
                  {" "}
                  (necesitas al menos 2 productos para 10%).
                </span>
              ) : null}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
              {reglasDescuentoCombo().map((regla) => (
                <li
                  key={regla.productos}
                  className="rounded-md border border-line bg-card px-2 py-1"
                >
                  {regla.productos}:{" "}
                  <span className="font-medium text-foreground">
                    {regla.descuento}
                  </span>
                </li>
              ))}
            </ul>
            {calculoPrecio ? (
              <div className="mt-4 flex flex-col gap-2 border-t border-accent/20 pt-4 text-sm">
                <p>
                  Subtotal componentes:{" "}
                  <span className="font-mono">
                    {formatoMoneda(calculoPrecio.subtotal)}
                  </span>
                  {" · "}
                  −{calculoPrecio.descuentoPct}% ={" "}
                  <span className="font-mono font-semibold text-accent">
                    {formatoMoneda(calculoPrecio.total)}
                  </span>
                </p>
                <p className="text-muted">
                  Precio guardado en catálogo:{" "}
                  {precioCombo != null ? (
                    <span className="font-mono text-foreground">
                      {formatoMoneda(precioCombo)}
                    </span>
                  ) : (
                    "sin precio"
                  )}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onAplicarPrecioSugerido()}
                  className="w-fit rounded-xl border border-accent bg-card px-4 py-2 text-sm font-semibold text-accent disabled:opacity-50"
                >
                  Guardar precio sugerido en el producto combo
                </button>
              </div>
            ) : componentes.length > 0 ? (
              <p className="mt-3 text-sm text-muted">
                Asigna precio en el{" "}
                <Link href="/catalogos" className="font-semibold text-accent">
                  catálogo
                </Link>{" "}
                para ver el total con descuento.
              </p>
            ) : null}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">Componentes del combo</h2>
            {componentes.length === 0 ? (
              <p className="text-sm text-muted">
                Este combo aún no tiene componentes en{" "}
                <span className="font-mono text-foreground">combo_componentes</span>
                .
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line bg-background">
                {componentes.map((fila) => {
                  const nombre =
                    fila.productos?.nombre ?? "Producto sin nombre";
                  const codigo = fila.productos?.codigo;
                  const editando = editingId === fila.id;

                  return (
                    <li
                      key={fila.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">{nombre}</p>
                        <p className="text-xs text-muted">
                          {fila.productos?.tipo ? (
                            <span className="mr-2 rounded bg-background px-1.5 py-0.5">
                              {etiquetaTipoProducto(fila.productos.tipo)}
                            </span>
                          ) : null}
                          {codigo ? (
                            <span className="font-mono">{codigo}</span>
                          ) : null}
                          {fila.productos?.precio != null ? (
                            <span className="ml-2 font-mono">
                              {formatoMoneda(fila.productos.precio)}
                            </span>
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
                              onChange={(e) => setCantidadEdit(e.target.value)}
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
            <h2 className="text-base font-semibold">Agregar componente</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="producto-componente"
                  className="text-sm font-medium text-foreground"
                >
                  Producto
                </label>
                <select
                  id="producto-componente"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  disabled={busy || productosComponente.length === 0}
                  className="rounded-xl border border-line bg-background px-4 py-3 text-sm disabled:opacity-60"
                >
                  {productosComponente.length === 0 ? (
                    <option value="">Sin productos disponibles</option>
                  ) : (
                    productosComponente.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                        {p.codigo ? ` · ${p.codigo}` : ""} ·{" "}
                        {etiquetaTipoProducto(p.tipo)}
                        {p.precio != null ? ` · ${formatoMoneda(p.precio)}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cantidad-nueva"
                  className="text-sm font-medium text-foreground"
                >
                  Cantidad
                </label>
                <input
                  id="cantidad-nueva"
                  type="text"
                  inputMode="decimal"
                  value={cantidadNueva}
                  onChange={(e) => setCantidadNueva(e.target.value)}
                  className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm sm:w-28"
                />
              </div>
              <button
                type="button"
                disabled={
                  busy ||
                  !productoId ||
                  productosComponente.length === 0
                }
                onClick={() => void onAgregar()}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Agregar
              </button>
            </div>
          </section>
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