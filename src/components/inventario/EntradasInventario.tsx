"use client";

import { getSupabaseBrowser } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Producto = {
  id: string;
  nombre: string;
  codigo: string | null;
};

type ExistenciaFila = {
  producto_id: string;
  cantidad: number;
  productos: { nombre: string; codigo: string | null } | null;
};

type MovimientoEntrada = {
  id: string;
  cantidad: number;
  nota: string | null;
  created_at: string;
  productos: { nombre: string; codigo: string | null } | null;
};

function productoRelacionado(
  productos:
    | { nombre: string; codigo: string | null }
    | { nombre: string; codigo: string | null }[]
    | null,
): { nombre: string; codigo: string | null } | null {
  if (!productos) {
    return null;
  }
  return Array.isArray(productos) ? (productos[0] ?? null) : productos;
}

export function EntradasInventario({ session }: { session: Session }) {
  const supabase = getSupabaseBrowser()!;
  const [productos, setProductos] = useState<Producto[]>([]);
  const [existencias, setExistencias] = useState<ExistenciaFila[]>([]);
  const [entradas, setEntradas] = useState<MovimientoEntrada[]>([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);

    const [productosRes, existenciasRes, entradasRes] = await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, codigo")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("existencias")
        .select("producto_id, cantidad, productos(nombre, codigo)")
        .order("producto_id"),
      supabase
        .from("movimientos_inventario")
        .select("id, cantidad, nota, created_at, productos(nombre, codigo)")
        .eq("tipo", "entrada")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (productosRes.error) {
      setError(productosRes.error.message);
      setCargando(false);
      return;
    }
    if (existenciasRes.error) {
      setError(existenciasRes.error.message);
      setCargando(false);
      return;
    }
    if (entradasRes.error) {
      setError(entradasRes.error.message);
      setCargando(false);
      return;
    }

    const lista = productosRes.data ?? [];
    setProductos(lista);
    setExistencias(
      (existenciasRes.data ?? []).map((fila) => ({
        producto_id: fila.producto_id,
        cantidad: Number(fila.cantidad),
        productos: productoRelacionado(
          fila.productos as Parameters<typeof productoRelacionado>[0],
        ),
      })),
    );
    setEntradas(
      (entradasRes.data ?? []).map((mov) => ({
        id: mov.id,
        cantidad: Number(mov.cantidad),
        nota: mov.nota,
        created_at: mov.created_at,
        productos: productoRelacionado(
          mov.productos as Parameters<typeof productoRelacionado>[0],
        ),
      })),
    );
    setProductoId((prev) => prev || lista[0]?.id || "");
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError(null);

      const [productosRes, existenciasRes, entradasRes] = await Promise.all([
        supabase
          .from("productos")
          .select("id, nombre, codigo")
          .eq("activo", true)
          .order("nombre"),
        supabase
          .from("existencias")
          .select("producto_id, cantidad, productos(nombre, codigo)")
          .order("producto_id"),
        supabase
          .from("movimientos_inventario")
          .select("id, cantidad, nota, created_at, productos(nombre, codigo)")
          .eq("tipo", "entrada")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (!activo) {
        return;
      }

      if (productosRes.error) {
        setError(productosRes.error.message);
        setCargando(false);
        return;
      }
      if (existenciasRes.error) {
        setError(existenciasRes.error.message);
        setCargando(false);
        return;
      }
      if (entradasRes.error) {
        setError(entradasRes.error.message);
        setCargando(false);
        return;
      }

      const lista = productosRes.data ?? [];
      setProductos(lista);
      setExistencias(
        (existenciasRes.data ?? []).map((fila) => ({
          producto_id: fila.producto_id,
          cantidad: Number(fila.cantidad),
          productos: productoRelacionado(
            fila.productos as Parameters<typeof productoRelacionado>[0],
          ),
        })),
      );
      setEntradas(
        (entradasRes.data ?? []).map((mov) => ({
          id: mov.id,
          cantidad: Number(mov.cantidad),
          nota: mov.nota,
          created_at: mov.created_at,
          productos: productoRelacionado(
            mov.productos as Parameters<typeof productoRelacionado>[0],
          ),
        })),
      );
      setProductoId((prev) => prev || lista[0]?.id || "");
      setCargando(false);
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [session.access_token, supabase]);

  const existenciaPorProducto = new Map(
    existencias.map((fila) => [fila.producto_id, Number(fila.cantidad)]),
  );

  async function registrarEntrada(event: React.FormEvent) {
    event.preventDefault();
    setMensaje(null);
    setError(null);

    const qty = Number(cantidad);
    if (!productoId || !Number.isFinite(qty) || qty <= 0) {
      setError("Elige un producto y una cantidad mayor a cero.");
      return;
    }

    setGuardando(true);

    const { error: movimientoError } = await supabase
      .from("movimientos_inventario")
      .insert({
        producto_id: productoId,
        tipo: "entrada",
        cantidad: qty,
        nota: nota.trim() || null,
        venta_id: null,
      });

    if (movimientoError) {
      setGuardando(false);
      setError(movimientoError.message);
      return;
    }

    const actual = existenciaPorProducto.get(productoId) ?? 0;
    const nuevaCantidad = actual + qty;

    const existenciaExistente = existencias.find(
      (f) => f.producto_id === productoId,
    );

    if (existenciaExistente) {
      const { error: updateError } = await supabase
        .from("existencias")
        .update({ cantidad: nuevaCantidad })
        .eq("producto_id", productoId);
      if (updateError) {
        setGuardando(false);
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("existencias").insert({
        producto_id: productoId,
        cantidad: nuevaCantidad,
      });
      if (insertError) {
        setGuardando(false);
        setError(insertError.message);
        return;
      }
    }

    setCantidad("");
    setNota("");
    setMensaje("Entrada registrada. Las existencias se actualizaron.");
    setGuardando(false);
    await cargarDatos();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  function formatoFecha(iso: string) {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  }

  function etiquetaProducto(nombre: string, codigo: string | null) {
    return codigo ? `${nombre} (${codigo})` : nombre;
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
            Inventario
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Entradas de mercancía</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Registra movimientos <code className="font-mono text-xs">entrada</code> y
            suma la cantidad en{" "}
            <code className="font-mono text-xs">existencias</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-lg border border-line bg-card px-3 py-2 font-medium hover:bg-background"
          >
            Inicio
          </Link>
          <button
            type="button"
            onClick={() => void cerrarSesion()}
            className="rounded-lg border border-line px-3 py-2 text-muted hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-5 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {mensaje ? (
        <p className="rounded-2xl border border-accent/30 bg-accent-soft px-5 py-3 text-sm text-accent" role="status">
          {mensaje}
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">Nueva entrada</h2>
        {productos.length === 0 && !cargando ? (
          <p className="mt-3 text-sm text-muted">
            No hay productos activos. Agrega productos en el catálogo antes de
            registrar entradas.
          </p>
        ) : (
          <form
            onSubmit={(e) => void registrarEntrada(e)}
            className="mt-4 grid max-w-xl gap-4"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Producto</span>
              <select
                required
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                disabled={cargando || guardando}
                className="rounded-lg border border-line bg-background px-3 py-2"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {etiquetaProducto(p.nombre, p.codigo)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Cantidad</span>
              <input
                type="number"
                required
                min="0.001"
                step="any"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                disabled={guardando}
                placeholder="Ej. 10"
                className="rounded-lg border border-line bg-background px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Nota (opcional)</span>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                disabled={guardando}
                className="rounded-lg border border-line bg-background px-3 py-2"
              />
            </label>
            <p className="text-xs text-muted">
              Existencia actual del producto seleccionado:{" "}
              <strong className="text-foreground">
                {existenciaPorProducto.get(productoId) ?? 0}
              </strong>
            </p>
            <button
              type="submit"
              disabled={guardando || cargando || productos.length === 0}
              className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Registrar entrada"}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Existencias</h2>
          {cargando ? (
            <span className="text-xs text-muted">Actualizando…</span>
          ) : null}
        </div>
        {existencias.length === 0 && !cargando ? (
          <p className="mt-3 text-sm text-muted">
            Todavía no hay filas en existencias. La primera entrada crea el
            registro del producto.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 pr-4 font-medium">Producto</th>
                  <th className="py-2 font-medium">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {existencias.map((fila) => (
                  <tr key={fila.producto_id} className="border-b border-line/70">
                    <td className="py-2 pr-4">
                      {fila.productos
                        ? etiquetaProducto(
                            fila.productos.nombre,
                            fila.productos.codigo,
                          )
                        : fila.producto_id}
                    </td>
                    <td className="py-2 font-mono tabular-nums">
                      {Number(fila.cantidad)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">Últimas entradas</h2>
        {entradas.length === 0 && !cargando ? (
          <p className="mt-3 text-sm text-muted">Aún no hay movimientos de entrada.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Producto</th>
                  <th className="py-2 pr-4 font-medium">Cantidad</th>
                  <th className="py-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((mov) => (
                  <tr key={mov.id} className="border-b border-line/70">
                    <td className="py-2 pr-4 whitespace-nowrap text-muted">
                      {formatoFecha(mov.created_at)}
                    </td>
                    <td className="py-2 pr-4">
                      {mov.productos
                        ? etiquetaProducto(
                            mov.productos.nombre,
                            mov.productos.codigo,
                          )
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 font-mono tabular-nums">
                      {Number(mov.cantidad)}
                    </td>
                    <td className="py-2 text-muted">{mov.nota ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}