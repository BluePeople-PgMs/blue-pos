"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Categoria } from "@/lib/catalogos/tipos";
import { nombreRequerido, ordenValido } from "@/lib/catalogos/validacion";
import { CatalogoLayout, inputClassName } from "./CatalogoLayout";

export function CategoriasCatalogo() {
  const supabase = getSupabaseBrowser();
  const [filas, setFilas] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(Boolean(supabase));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(
    supabase ? null : "Faltan las variables de Supabase.",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("0");

  const cargar = useCallback(async (mostrarCarga = false) => {
    if (!supabase) {
      return;
    }
    if (mostrarCarga) {
      setCargando(true);
    }
    setError(null);
    const { data, error: qError } = await supabase
      .from("categorias")
      .select("id, nombre, orden, created_at")
      .order("orden")
      .order("nombre");
    if (qError) {
      setError(qError.message);
      setFilas([]);
    } else {
      setFilas((data ?? []) as Categoria[]);
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
        .from("categorias")
        .select("id, nombre, orden, created_at")
        .order("orden")
        .order("nombre");
      if (!activo) {
        return;
      }
      if (qError) {
        setError(qError.message);
        setFilas([]);
      } else {
        setFilas((data ?? []) as Categoria[]);
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
    setOrden("0");
  }

  function empezarEdicion(fila: Categoria) {
    setEditId(fila.id);
    setNombre(fila.nombre);
    setOrden(String(fila.orden));
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
    const ordenNum = Number(orden);
    const ordenErr = ordenValido(ordenNum);
    if (nombreErr || ordenErr) {
      setError([nombreErr, ordenErr].filter(Boolean).join(" "));
      return;
    }

    setGuardando(true);
    setError(null);
    const payload = { nombre: nombre.trim(), orden: ordenNum };

    const { error: writeError } = editId
      ? await supabase.from("categorias").update(payload).eq("id", editId)
      : await supabase.from("categorias").insert(payload);

    setGuardando(false);
    if (writeError) {
      setError(writeError.message);
      return;
    }

    setMensaje(editId ? "Categoría actualizada." : "Categoría creada.");
    limpiarFormulario();
    await cargar(true);
  }

  async function eliminar(id: string) {
    if (!supabase || !confirm("¿Eliminar esta categoría?")) {
      return;
    }
    setError(null);
    setMensaje(null);
    const { error: delError } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    setMensaje("Categoría eliminada.");
    if (editId === id) {
      limpiarFormulario();
    }
    await cargar(true);
  }

  return (
    <CatalogoLayout
      titulo="Categorías"
      descripcion="Clasificación de productos. El campo orden controla cómo aparecen en listas."
      error={error}
      mensaje={mensaje}
    >
      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">
          {editId ? "Editar categoría" : "Nueva categoría"}
        </h2>
        <form
          onSubmit={(e) => void guardar(e)}
          className="mt-4 grid max-w-md gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
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
            <span className="font-medium">Orden</span>
            <input
              type="number"
              min={0}
              step={1}
              required
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className={inputClassName}
              disabled={guardando}
            />
          </label>
          <div className="flex flex-wrap gap-2">
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
          <p className="mt-3 text-sm text-muted">Sin categorías todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {filas.map((fila) => (
              <li
                key={fila.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <span>
                  <strong className="text-foreground">{fila.nombre}</strong>
                  <span className="ml-2 text-muted">orden {fila.orden}</span>
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
            ))}
          </ul>
        )}
      </section>
    </CatalogoLayout>
  );
}