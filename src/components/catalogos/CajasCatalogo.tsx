"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Caja } from "@/lib/catalogos/tipos";
import { nombreRequerido } from "@/lib/catalogos/validacion";
import { CatalogoLayout, inputClassName } from "./CatalogoLayout";

export function CajasCatalogo() {
  const supabase = getSupabaseBrowser();
  const [filas, setFilas] = useState<Caja[]>([]);
  const [cargando, setCargando] = useState(Boolean(supabase));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(
    supabase ? null : "Faltan las variables de Supabase.",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [activa, setActiva] = useState(true);

  const cargar = useCallback(async (mostrarCarga = false) => {
    if (!supabase) {
      return;
    }
    if (mostrarCarga) {
      setCargando(true);
    }
    setError(null);
    const { data, error: qError } = await supabase
      .from("cajas")
      .select("id, nombre, activa")
      .order("nombre");
    if (qError) {
      setError(qError.message);
      setFilas([]);
    } else {
      setFilas((data ?? []) as Caja[]);
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
        .from("cajas")
        .select("id, nombre, activa")
        .order("nombre");
      if (!activo) {
        return;
      }
      if (qError) {
        setError(qError.message);
        setFilas([]);
      } else {
        setFilas((data ?? []) as Caja[]);
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
    setActiva(true);
  }

  function empezarEdicion(fila: Caja) {
    setEditId(fila.id);
    setNombre(fila.nombre);
    setActiva(fila.activa);
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
    if (nombreErr) {
      setError(nombreErr);
      return;
    }

    setGuardando(true);
    setError(null);
    const payload = { nombre: nombre.trim(), activa };

    const { error: writeError } = editId
      ? await supabase.from("cajas").update(payload).eq("id", editId)
      : await supabase.from("cajas").insert(payload);

    setGuardando(false);
    if (writeError) {
      setError(writeError.message);
      return;
    }

    setMensaje(editId ? "Caja actualizada." : "Caja creada.");
    limpiarFormulario();
    await cargar(true);
  }

  async function eliminar(id: string) {
    if (!supabase || !confirm("¿Eliminar esta caja?")) {
      return;
    }
    setError(null);
    setMensaje(null);
    const { error: delError } = await supabase.from("cajas").delete().eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    setMensaje("Caja eliminada.");
    if (editId === id) {
      limpiarFormulario();
    }
    await cargar(true);
  }

  return (
    <CatalogoLayout
      titulo="Cajas"
      descripcion="Puntos de cobro. Las ventas futuras usarán el select de cajas activas."
      error={error}
      mensaje={mensaje}
    >
      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">
          {editId ? "Editar caja" : "Nueva caja"}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
              disabled={guardando}
            />
            <span className="font-medium">Activa</span>
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
          <p className="mt-3 text-sm text-muted">Sin cajas todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {filas.map((fila) => (
              <li
                key={fila.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <span>
                  <strong className="text-foreground">{fila.nombre}</strong>
                  <span className="ml-2 text-muted">
                    {fila.activa ? "activa" : "inactiva"}
                  </span>
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