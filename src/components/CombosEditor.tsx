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
import { ComboTarjetaCine } from "@/components/combos/ComboTarjetaCine";
import { ComponenteTarjetaVisual } from "@/components/combos/ComponenteTarjetaVisual";
import { ArticuloPresentacionVisual } from "@/components/ventas/ArticuloPresentacionVisual";
import Image from "next/image";
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
  const [paso, setPaso] = useState<1 | 2>(1);

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
      setCombos(data ?? []);
    })();

    return () => {
      activo = false;
    };
  }, []);

  function elegirCombo(nextId: string) {
    setComboId(nextId);
    setPaso(2);
    void cargarDetalle(nextId);
  }

  function volverAElegirCombo() {
    setPaso(1);
    setEditingId(null);
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
    <div className="flex flex-col gap-8">
      <ol className="flex flex-wrap gap-3 text-sm font-medium">
        <li
          className={`rounded-full px-4 py-1.5 ${
            paso === 1
              ? "bg-accent text-white"
              : "border border-line bg-card text-muted"
          }`}
        >
          1. Selecciona tu combo
        </li>
        <li
          className={`rounded-full px-4 py-1.5 ${
            paso === 2
              ? "bg-accent text-white"
              : "border border-line bg-card text-muted"
          }`}
        >
          2. Arma ingredientes
        </li>
      </ol>

      {paso === 1 ? (
        <section className="concesion-panel overflow-hidden rounded-2xl">
          <div className="relative mx-4 mt-4 aspect-[16/4] overflow-hidden rounded-xl sm:mx-5">
            <Image
              src="/combos/selecciona-tu-combo.png"
              alt=""
              fill
              className="object-contain p-2"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
          <header className="concesion-header px-5 pb-2 pt-4">
            <h2 className="text-lg font-semibold text-white">
              Elige el platillo combo
            </h2>
            <p className="text-sm text-white/70">
              Toca una tarjeta para continuar y agregar los ingredientes.
            </p>
          </header>
          {combos.length === 0 && !loading ? (
            <p className="px-5 pb-8 text-sm text-white/70">
              Crea un producto{" "}
              <span className="font-mono">tipo = combo</span> en{" "}
              <Link href="/catalogos?tipo=combo" className="text-[#f5c451] underline">
                catálogo
              </Link>
              .
            </p>
          ) : (
            <div className="concesion-scroll flex gap-4 overflow-x-auto px-5 py-5">
              {combos.map((combo) => (
                <ComboTarjetaCine
                  key={combo.id}
                  id={combo.id}
                  nombre={combo.nombre}
                  codigo={combo.codigo}
                  precio={combo.precio}
                  seleccionado={combo.id === comboId}
                  disabled={loading || busy}
                  onSeleccionar={elegirCombo}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {paso === 2 && comboSeleccionado ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative h-14 w-full max-w-xl overflow-hidden rounded-lg sm:h-16">
              <Image
                src="/combos/paso-ingredientes.svg"
                alt=""
                fill
                className="object-cover object-left"
                sizes="640px"
              />
            </div>
            <button
              type="button"
              onClick={volverAElegirCombo}
              className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-medium"
            >
              Cambiar combo
            </button>
          </div>

          <article className="concesion-panel overflow-hidden rounded-2xl">
            <div className="grid gap-4 p-5 sm:grid-cols-[12rem_1fr]">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[12rem] overflow-hidden rounded-xl">
                <ArticuloPresentacionVisual
                  nombre={comboSeleccionado.nombre}
                  esCombo
                  descuentoPct={descuentoPct}
                />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#f5c451] uppercase">
                  Tu combo
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {comboSeleccionado.nombre}
                </h2>
                {comboSeleccionado.precio != null ? (
                  <p className="mt-2 font-mono text-lg text-[#f5c451]">
                    {formatoMoneda(comboSeleccionado.precio)}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
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

          <section className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground">
              Ingredientes en tu combo
            </h2>
            {componentes.length === 0 ? (
              <p className="text-sm text-muted">
                Agrega productos del carril de abajo para armar el platillo.
              </p>
            ) : (
              <ul className="concesion-scroll flex gap-4 overflow-x-auto py-1">
                {componentes.map((fila) => (
                  <ComponenteTarjetaVisual
                    key={fila.id}
                    nombre={fila.productos?.nombre ?? "Producto sin nombre"}
                    codigo={fila.productos?.codigo ?? null}
                    tipo={fila.productos?.tipo ?? null}
                    precio={fila.productos?.precio ?? null}
                    cantidad={fila.cantidad}
                    editando={editingId === fila.id}
                    cantidadEdit={cantidadEdit}
                    busy={busy}
                    onEditar={() => {
                      setEditingId(fila.id);
                      setCantidadEdit(String(fila.cantidad));
                    }}
                    onGuardar={() => void onGuardarCantidad(fila.id)}
                    onCancelarEdit={() => setEditingId(null)}
                    onQuitar={() => void onQuitar(fila.id)}
                    onCantidadEditChange={setCantidadEdit}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="concesion-panel rounded-2xl px-5 py-5">
            <h2 className="text-base font-semibold text-white">Sumar ingrediente</h2>
            <p className="mt-1 text-sm text-white/70">
              Elige del catálogo y confirma cantidad.
            </p>
            {productosComponente.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">
                No hay más productos disponibles para este combo.
              </p>
            ) : (
              <>
                <div className="concesion-scroll mt-4 flex gap-3 overflow-x-auto">
                  {productosComponente.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={busy}
                      onClick={() => setProductoId(p.id)}
                      className={`concesion-card w-[9rem] shrink-0 overflow-hidden rounded-lg ${
                        productoId === p.id
                          ? "ring-2 ring-[#f5c451]"
                          : ""
                      }`}
                    >
                      <div className="relative aspect-square w-full">
                        <ArticuloPresentacionVisual
                          nombre={p.nombre}
                          esCombo={false}
                          compacto
                        />
                      </div>
                      <p className="concesion-card-pie truncate px-2 py-2 text-center text-[10px] text-white">
                        {p.nombre}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-sm text-white/80">
                    Cantidad
                    <input
                      id="cantidad-nueva"
                      type="text"
                      inputMode="decimal"
                      value={cantidadNueva}
                      onChange={(e) => setCantidadNueva(e.target.value)}
                      className="w-28 rounded-lg border border-white/20 bg-black/30 px-3 py-2 font-mono text-white"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !productoId}
                    onClick={() => void onAgregar()}
                    className="concesion-btn-agregar rounded-full px-6 py-2.5 text-sm font-bold"
                  >
                    Agregar al combo
                  </button>
                </div>
              </>
            )}
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