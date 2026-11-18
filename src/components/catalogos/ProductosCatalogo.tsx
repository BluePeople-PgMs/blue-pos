"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  TIPOS_PRODUCTO,
  esTipoProducto,
  type Producto,
} from "@/lib/catalogos/tipos";
import { nombreRequerido, precioValido } from "@/lib/catalogos/validacion";
import { etiquetaProducto } from "@/lib/catalogos/etiquetas";
import { SelectCategoria, SelectUnidad } from "@/components/catalogos/selects";
import { selectClassName } from "@/components/catalogos/selects/selectStyles";
import { CatalogoLayout, inputClassName } from "./CatalogoLayout";

type ProductoFila = Producto & {
  categorias: { nombre: string } | { nombre: string }[] | null;
  unidades: { abreviatura: string } | { abreviatura: string }[] | null;
};

function relacionUno<T>(
  rel: T | T[] | null,
): T | null {
  if (!rel) {
    return null;
  }
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export function ProductosCatalogo() {
  const supabase = getSupabaseBrowser();
  const [filas, setFilas] = useState<ProductoFila[]>([]);
  const [cargando, setCargando] = useState(Boolean(supabase));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(
    supabase ? null : "Faltan las variables de Supabase.",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<string>("directo");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [precio, setPrecio] = useState("");
  const [codigo, setCodigo] = useState("");
  const [activo, setActivo] = useState(true);

  const cargar = useCallback(async (mostrarCarga = false) => {
    if (!supabase) {
      return;
    }
    if (mostrarCarga) {
      setCargando(true);
    }
    setError(null);
    const { data, error: qError } = await supabase
      .from("productos")
      .select(
        "id, nombre, tipo, categoria_id, unidad_id, precio, codigo, activo, created_at, categorias(nombre), unidades(abreviatura)",
      )
      .order("nombre");
    if (qError) {
      setError(qError.message);
      setFilas([]);
    } else {
      setFilas((data ?? []) as ProductoFila[]);
    }
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let activo = true;
    void (async () => {
      const { data, error: qError } = await supabase
        .from("productos")
        .select(
          "id, nombre, tipo, categoria_id, unidad_id, precio, codigo, activo, created_at, categorias(nombre), unidades(abreviatura)",
        )
        .order("nombre");
      if (!activo) {
        return;
      }
      if (qError) {
        setError(qError.message);
        setFilas([]);
      } else {
        setFilas((data ?? []) as ProductoFila[]);
      }
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, [supabase]);

  function limpiarFormulario() {
    setEditId(null);
    setNombre("");
    setTipo("directo");
    setCategoriaId("");
    setUnidadId("");
    setPrecio("");
    setCodigo("");
    setActivo(true);
  }

  function empezarEdicion(fila: ProductoFila) {
    setEditId(fila.id);
    setNombre(fila.nombre);
    setTipo(fila.tipo);
    setCategoriaId(fila.categoria_id ?? "");
    setUnidadId(fila.unidad_id ?? "");
    setPrecio(fila.precio != null ? String(fila.precio) : "");
    setCodigo(fila.codigo ?? "");
    setActivo(fila.activo);
    setMensaje(null);
    setError(null);
  }

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) {
      return;
    }
    setMensaje(null);
    const nombreErr = nombreRequerido(nombre);
    const precioErr = precioValido(precio);
    if (!esTipoProducto(tipo)) {
      setError("Elige un tipo de producto válido.");
      return;
    }
    if (nombreErr || precioErr) {
      setError([nombreErr, precioErr].filter(Boolean).join(" "));
      return;
    }

    setGuardando(true);
    setError(null);
    const payload = {
      nombre: nombre.trim(),
      tipo,
      categoria_id: categoriaId || null,
      unidad_id: unidadId || null,
      precio: precio.trim() ? Number(precio) : null,
      codigo: codigo.trim() || null,
      activo,
    };

    const { error: writeError } = editId
      ? await supabase.from("productos").update(payload).eq("id", editId)
      : await supabase.from("productos").insert(payload);

    setGuardando(false);
    if (writeError) {
      setError(writeError.message);
      return;
    }

    setMensaje(editId ? "Producto actualizado." : "Producto creado.");
    limpiarFormulario();
    await cargar(true);
  }

  async function eliminar(id: string) {
    if (
      !supabase ||
      !confirm(
        "¿Eliminar este producto? Si tiene existencias o movimientos, la base puede rechazarlo.",
      )
    ) {
      return;
    }
    setError(null);
    setMensaje(null);
    const { error: delError } = await supabase
      .from("productos")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    setMensaje("Producto eliminado.");
    if (editId === id) {
      limpiarFormulario();
    }
    await cargar(true);
  }

  return (
    <CatalogoLayout
      titulo="Productos"
      descripcion="Mostrador, preparados, insumos y combos. Inventario y ventas consumen estos registros."
      error={error}
      mensaje={mensaje}
    >
      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">
          {editId ? "Editar producto" : "Nuevo producto"}
        </h2>
        <form
          onSubmit={(e) => void guardar(e)}
          className="mt-4 grid max-w-lg gap-3 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Nombre</span>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClassName}
              disabled={guardando}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              required
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={selectClassName}
              disabled={guardando}
            >
              {TIPOS_PRODUCTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Código (opcional)</span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className={inputClassName}
              disabled={guardando}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Categoría</span>
            <SelectCategoria
              value={categoriaId}
              onChange={setCategoriaId}
              permitirVacio
              disabled={guardando}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Unidad</span>
            <SelectUnidad
              value={unidadId}
              onChange={setUnidadId}
              permitirVacio
              disabled={guardando}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Precio (opcional)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className={inputClassName}
              disabled={guardando}
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              disabled={guardando}
            />
            <span className="font-medium">Activo (visible en inventario y ventas)</span>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {guardando ? "Guardando…" : editId ? "Actualizar" : "Crear"}
            </button>
            {editId ? (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">Listado</h2>
        {cargando ? (
          <p className="mt-3 text-sm text-muted">Cargando…</p>
        ) : filas.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Sin productos todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {filas.map((fila) => {
              const cat = relacionUno(fila.categorias);
              const uni = relacionUno(fila.unidades);
              return (
                <li
                  key={fila.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <span>
                    <strong className="text-foreground">
                      {etiquetaProducto(fila.nombre, fila.codigo)}
                    </strong>
                    <span className="ml-2 text-muted">{fila.tipo}</span>
                    {cat ? (
                      <span className="ml-2 text-muted">· {cat.nombre}</span>
                    ) : null}
                    {uni ? (
                      <span className="ml-1 font-mono text-xs text-muted">
                        {uni.abreviatura}
                      </span>
                    ) : null}
                    {!fila.activo ? (
                      <span className="ml-2 text-warn">inactivo</span>
                    ) : null}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => empezarEdicion(fila)}
                      className="rounded-lg border border-line px-3 py-1.5 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void eliminar(fila.id)}
                      className="rounded-lg border border-danger/40 px-3 py-1.5 font-medium text-danger"
                    >
                      Eliminar
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </CatalogoLayout>
  );
}