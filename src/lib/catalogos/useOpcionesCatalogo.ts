"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Caja, Categoria, ProductoOpcion, Unidad } from "@/lib/catalogos/tipos";

type EstadoLista<T> = {
  items: T[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
};

function useListar<T>(
  cargar: () => Promise<{ data: T[] | null; error: Error | null }>,
): EstadoLista<T> {
  const tieneCliente = Boolean(getSupabaseBrowser());
  const [items, setItems] = useState<T[]>([]);
  const [cargando, setCargando] = useState(tieneCliente);
  const [error, setError] = useState<string | null>(
    tieneCliente ? null : "Faltan las variables de Supabase.",
  );
  const [tick, setTick] = useState(0);

  const recargar = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!tieneCliente) {
      return;
    }

    let activo = true;

    async function run() {
      setCargando(true);
      setError(null);
      const result = await cargar();
      if (!activo) {
        return;
      }
      if (result.error) {
        setError(result.error.message);
        setItems([]);
      } else {
        setItems(result.data ?? []);
      }
      setCargando(false);
    }

    void run();

    return () => {
      activo = false;
    };
  }, [cargar, tick, tieneCliente]);

  return { items, cargando, error, recargar };
}

export function useCategorias(): EstadoLista<Categoria> {
  const cargar = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return { data: null, error: new Error("Sin cliente Supabase.") };
    }
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre, orden, created_at")
      .order("orden")
      .order("nombre");
    return { data: data as Categoria[] | null, error: error ? new Error(error.message) : null };
  }, []);

  return useListar(cargar);
}

export function useUnidades(): EstadoLista<Unidad> {
  const cargar = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return { data: null, error: new Error("Sin cliente Supabase.") };
    }
    const { data, error } = await supabase
      .from("unidades")
      .select("id, nombre, abreviatura")
      .order("nombre");
    return { data: data as Unidad[] | null, error: error ? new Error(error.message) : null };
  }, []);

  return useListar(cargar);
}

export function useCajasActivas(): EstadoLista<Caja> {
  const cargar = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return { data: null, error: new Error("Sin cliente Supabase.") };
    }
    const { data, error } = await supabase
      .from("cajas")
      .select("id, nombre, activa")
      .eq("activa", true)
      .order("nombre");
    return { data: data as Caja[] | null, error: error ? new Error(error.message) : null };
  }, []);

  return useListar(cargar);
}

type UseProductosOpts = {
  incluirInactivos?: boolean;
};

export function useProductosActivos(
  opts: UseProductosOpts = {},
): EstadoLista<ProductoOpcion> {
  const { incluirInactivos = false } = opts;

  const cargar = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return { data: null, error: new Error("Sin cliente Supabase.") };
    }
    let query = supabase
      .from("productos")
      .select("id, nombre, codigo")
      .order("nombre");
    if (!incluirInactivos) {
      query = query.eq("activo", true);
    }
    const { data, error } = await query;
    return {
      data: data as ProductoOpcion[] | null,
      error: error ? new Error(error.message) : null,
    };
  }, [incluirInactivos]);

  return useListar(cargar);
}