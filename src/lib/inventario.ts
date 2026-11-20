import { getSupabaseBrowser } from "@/lib/supabase";

export type ProductoInventario = {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  categoria: string;
  orden: number;
  unidad: string;
  existencia: number | null;
};

export type CajaInventario = {
  id: string;
  nombre: string;
};

export type EntradaReciente = {
  id: string;
  producto: string;
  cantidad: number;
  unidad: string;
  nota: string;
  cuando: string;
};

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

export async function leerInventario() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error: "Faltan las variables de Supabase.",
      sesion: false,
      productos: [] as ProductoInventario[],
      cajas: [] as CajaInventario[],
      entradas: [] as EntradaReciente[],
    };
  }

  const { data: sesionData } = await supabase.auth.getSession();
  const sesion = Boolean(sesionData.session);

  const [productosRes, categoriasRes, unidadesRes, cajasRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, codigo, tipo, categoria_id, unidad_id")
      .eq("activo", true),
    supabase.from("categorias").select("id, nombre, orden"),
    supabase.from("unidades").select("id, nombre, abreviatura"),
    supabase.from("cajas").select("id, nombre").eq("activa", true),
  ]);

  const errorCatalogo =
    productosRes.error ?? categoriasRes.error ?? unidadesRes.error ?? cajasRes.error;
  if (errorCatalogo) {
    return {
      error: mensajeLegible(errorCatalogo.message),
      sesion,
      productos: [] as ProductoInventario[],
      cajas: [] as CajaInventario[],
      entradas: [] as EntradaReciente[],
    };
  }

  const categorias = new Map(
    (categoriasRes.data ?? []).map((categoria) => [categoria.id, categoria]),
  );
  const unidades = new Map(
    (unidadesRes.data ?? []).map((unidad) => [unidad.id, unidad]),
  );

  let existencias = new Map<string, number>();
  let aviso: string | null = null;
  let entradas: EntradaReciente[] = [];

  if (!sesion) {
    aviso = SIN_SESION;
  } else {
    const [existenciasRes, movimientosRes] = await Promise.all([
      supabase.from("existencias").select("producto_id, cantidad"),
      supabase
        .from("movimientos_inventario")
        .select("id, producto_id, cantidad, nota, created_at")
        .eq("tipo", "entrada")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (existenciasRes.error || movimientosRes.error) {
      aviso = SIN_SESION;
    } else {
      existencias = new Map(
        (existenciasRes.data ?? []).map((fila) => [
          fila.producto_id,
          Number(fila.cantidad),
        ]),
      );
      const nombres = new Map(
        (productosRes.data ?? []).map((producto) => [producto.id, producto]),
      );
      entradas = (movimientosRes.data ?? []).map((movimiento) => {
        const producto = nombres.get(movimiento.producto_id);
        const unidad = producto?.unidad_id
          ? unidades.get(producto.unidad_id)
          : undefined;
        return {
          id: movimiento.id,
          producto: producto?.nombre ?? "Producto",
          cantidad: Number(movimiento.cantidad),
          unidad: unidad?.abreviatura ?? unidad?.nombre ?? "",
          nota: movimiento.nota ?? "",
          cuando: movimiento.created_at,
        };
      });
    }
  }

  const productos = (productosRes.data ?? []).map((producto) => {
    const categoria = producto.categoria_id
      ? categorias.get(producto.categoria_id)
      : undefined;
    const unidad = producto.unidad_id
      ? unidades.get(producto.unidad_id)
      : undefined;
    return {
      id: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo ?? "",
      tipo: producto.tipo,
      categoria: categoria?.nombre ?? "Sin categoría",
      orden: categoria?.orden ?? 999,
      unidad: unidad?.abreviatura ?? unidad?.nombre ?? "",
      existencia: aviso ? null : (existencias.get(producto.id) ?? 0),
    };
  });

  productos.sort((a, b) => {
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.nombre.localeCompare(b.nombre, "es");
  });

  return {
    error: aviso,
    sesion: !aviso && sesion,
    productos,
    cajas: (cajasRes.data ?? []) as CajaInventario[],
    entradas,
  };
}

export async function registrarEntrada(datos: {
  productoId: string;
  cantidad: number;
  nota: string;
  cajaId: string | null;
}) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase." };
  }

  const { data: sesionData } = await supabase.auth.getSession();
  if (!sesionData.session) {
    return { error: SIN_SESION };
  }

  if (!(datos.cantidad > 0)) {
    return { error: "La cantidad tiene que ser mayor a cero." };
  }

  const { data: actual, error: leerError } = await supabase
    .from("existencias")
    .select("id, cantidad")
    .eq("producto_id", datos.productoId)
    .maybeSingle();

  if (leerError) {
    return { error: mensajeLegible(leerError.message) };
  }

  const anterior = Number(actual?.cantidad ?? 0);
  const siguiente = anterior + datos.cantidad;

  if (actual) {
    const { error } = await supabase
      .from("existencias")
      .update({ cantidad: siguiente })
      .eq("id", actual.id);
    if (error) return { error: mensajeLegible(error.message) };
  } else {
    const { error } = await supabase.from("existencias").insert({
      producto_id: datos.productoId,
      cantidad: siguiente,
    });
    if (error) return { error: mensajeLegible(error.message) };
  }

  const { error: movimientoError } = await supabase
    .from("movimientos_inventario")
    .insert({
      producto_id: datos.productoId,
      caja_id: datos.cajaId,
      venta_id: null,
      tipo: "entrada",
      cantidad: datos.cantidad,
      nota: datos.nota.trim() || null,
    });

  if (movimientoError) {
    if (actual) {
      await supabase
        .from("existencias")
        .update({ cantidad: anterior })
        .eq("id", actual.id);
    } else {
      await supabase
        .from("existencias")
        .delete()
        .eq("producto_id", datos.productoId);
    }
    return { error: mensajeLegible(movimientoError.message) };
  }

  return { error: null };
}

function mensajeLegible(mensaje: string) {
  if (
    mensaje.toLowerCase().includes("permission") ||
    mensaje.toLowerCase().includes("jwt") ||
    mensaje.toLowerCase().includes("row-level")
  ) {
    return SIN_SESION;
  }
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudo guardar la entrada. La base no respondió.";
  }
  return mensaje;
}
