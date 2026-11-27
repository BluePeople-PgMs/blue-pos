import type { SupabaseClient } from "@supabase/supabase-js";

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

function mensajeLegible(mensaje: string) {
  if (
    mensaje.toLowerCase().includes("permission") ||
    mensaje.toLowerCase().includes("jwt") ||
    mensaje.toLowerCase().includes("row-level")
  ) {
    return SIN_SESION;
  }
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudo completar la operación. La base no respondió.";
  }
  return mensaje;
}

export type LineaSalidaVenta = {
  productoId: string;
  cantidad: number;
  producto?: string;
};

type RecetaPlato = {
  rendimiento: number;
  lineas: { insumoId: string; cantidad: number }[];
};

function acumularSalidaDesdeProducto(
  productoId: string,
  cantidad: number,
  tipoPorId: Map<string, string>,
  recetaPorPlato: Map<string, RecetaPlato>,
  salidas: Map<string, number>,
  nombrePorId: Map<string, string>,
): string | null {
  const tipo = tipoPorId.get(productoId);

  if (tipo === "directo") {
    salidas.set(productoId, (salidas.get(productoId) ?? 0) + cantidad);
    return null;
  }

  if (tipo === "preparado") {
    const receta = recetaPorPlato.get(productoId);
    const nombre = nombrePorId.get(productoId) ?? "platillo";
    if (!receta || receta.lineas.length === 0) {
      return `No hay receta cargada para ${nombre}. Corre npm run sembrar:recetas.`;
    }
    const factor = cantidad / receta.rendimiento;
    for (const insumo of receta.lineas) {
      const total = insumo.cantidad * factor;
      salidas.set(insumo.insumoId, (salidas.get(insumo.insumoId) ?? 0) + total);
    }
    return null;
  }

  if (tipo === "combo") {
    return "Configuración de combo inválida en la venta.";
  }

  return null;
}

export async function calcularSalidasInventarioPorLineas(
  supabase: SupabaseClient,
  lineas: LineaSalidaVenta[],
) {
  const productoIdsLinea = lineas
    .map((linea) => linea.productoId)
    .filter(Boolean);

  if (productoIdsLinea.length === 0) {
    return {
      error: "Agrega al menos una línea con producto.",
      salidas: new Map<string, number>(),
      nombrePorId: new Map<string, string>(),
    };
  }

  const { data: productosLinea, error: productosLineaError } = await supabase
    .from("productos")
    .select("id, nombre, tipo")
    .in("id", productoIdsLinea);
  if (productosLineaError) {
    return {
      error: mensajeLegible(productosLineaError.message),
      salidas: new Map<string, number>(),
      nombrePorId: new Map<string, string>(),
    };
  }

  const tipoLinea = new Map(
    (productosLinea ?? []).map((producto) => [producto.id, producto.tipo]),
  );

  const comboIdsEnVenta = productoIdsLinea.filter(
    (id) => tipoLinea.get(id) === "combo",
  );

  const componentesPorCombo = new Map<
    string,
    { productoId: string; cantidad: number }[]
  >();

  if (comboIdsEnVenta.length > 0) {
    const { data: filasComponentes, error: compError } = await supabase
      .from("combo_componentes")
      .select("combo_id, producto_id, cantidad")
      .in("combo_id", comboIdsEnVenta);

    if (compError) {
      return {
        error: mensajeLegible(compError.message),
        salidas: new Map<string, number>(),
        nombrePorId: new Map<string, string>(),
      };
    }

    for (const fila of filasComponentes ?? []) {
      if (!fila.combo_id || !fila.producto_id) continue;
      const lista = componentesPorCombo.get(fila.combo_id) ?? [];
      lista.push({
        productoId: fila.producto_id,
        cantidad: Number(fila.cantidad ?? 1),
      });
      componentesPorCombo.set(fila.combo_id, lista);
    }
  }

  const idsComponentes = [
    ...new Set(
      [...componentesPorCombo.values()]
        .flat()
        .map((pieza) => pieza.productoId),
    ),
  ];
  const idsParaTipos = [...new Set([...productoIdsLinea, ...idsComponentes])];

  const { data: productosVenta, error: productosError } = await supabase
    .from("productos")
    .select("id, nombre, tipo")
    .in("id", idsParaTipos);
  if (productosError) {
    return {
      error: mensajeLegible(productosError.message),
      salidas: new Map<string, number>(),
      nombrePorId: new Map<string, string>(),
    };
  }

  const tipoPorId = new Map(
    (productosVenta ?? []).map((producto) => [producto.id, producto.tipo]),
  );
  const nombrePorId = new Map(
    (productosVenta ?? []).map((producto) => [producto.id, producto.nombre]),
  );

  for (const linea of lineas) {
    if (linea.producto) {
      nombrePorId.set(linea.productoId, linea.producto);
    }
  }

  const preparadoIds = idsParaTipos.filter(
    (id) => tipoPorId.get(id) === "preparado",
  );

  const recetaPorPlato = new Map<string, RecetaPlato>();

  if (preparadoIds.length > 0) {
    const { data: recetas, error: recetasError } = await supabase
      .from("recetas")
      .select("id, producto_id, rendimiento")
      .in("producto_id", preparadoIds);
    if (recetasError) {
      return {
        error: mensajeLegible(recetasError.message),
        salidas: new Map<string, number>(),
        nombrePorId,
      };
    }

    const recetaIds = (recetas ?? []).map((receta) => receta.id);
    const { data: insumosReceta, error: insumosError } = await supabase
      .from("receta_insumos")
      .select("receta_id, insumo_id, cantidad")
      .in("receta_id", recetaIds);
    if (insumosError) {
      return {
        error: mensajeLegible(insumosError.message),
        salidas: new Map<string, number>(),
        nombrePorId,
      };
    }

    const lineasPorReceta = new Map<
      string,
      { insumoId: string; cantidad: number }[]
    >();
    for (const fila of insumosReceta ?? []) {
      const lista = lineasPorReceta.get(fila.receta_id) ?? [];
      lista.push({
        insumoId: fila.insumo_id,
        cantidad: Number(fila.cantidad),
      });
      lineasPorReceta.set(fila.receta_id, lista);
    }

    for (const receta of recetas ?? []) {
      recetaPorPlato.set(receta.producto_id, {
        rendimiento: Number(receta.rendimiento || 1),
        lineas: lineasPorReceta.get(receta.id) ?? [],
      });
    }
  }

  const salidas = new Map<string, number>();

  for (const linea of lineas) {
    const tipo = tipoPorId.get(linea.productoId);

    if (tipo === "combo") {
      const etiqueta =
        linea.producto ?? nombrePorId.get(linea.productoId) ?? "combo";
      const partes = componentesPorCombo.get(linea.productoId) ?? [];
      if (partes.length === 0) {
        return {
          error: `El combo «${etiqueta}» no tiene componentes. Genera combos en el módulo Combos.`,
          salidas: new Map<string, number>(),
          nombrePorId,
        };
      }
      for (const parte of partes) {
        const cantidadPieza = linea.cantidad * parte.cantidad;
        const errorPieza = acumularSalidaDesdeProducto(
          parte.productoId,
          cantidadPieza,
          tipoPorId,
          recetaPorPlato,
          salidas,
          nombrePorId,
        );
        if (errorPieza) {
          return {
            error: errorPieza,
            salidas: new Map<string, number>(),
            nombrePorId,
          };
        }
      }
      continue;
    }

    const errorLinea = acumularSalidaDesdeProducto(
      linea.productoId,
      linea.cantidad,
      tipoPorId,
      recetaPorPlato,
      salidas,
      nombrePorId,
    );
    if (errorLinea) {
      return {
        error: errorLinea,
        salidas: new Map<string, number>(),
        nombrePorId,
      };
    }
  }

  const insumoIdsSalida = [...salidas.keys()].filter(
    (id) => !nombrePorId.has(id),
  );
  if (insumoIdsSalida.length > 0) {
    const { data: nombresInsumo, error: nombresError } = await supabase
      .from("productos")
      .select("id, nombre")
      .in("id", insumoIdsSalida);
    if (nombresError) {
      return {
        error: mensajeLegible(nombresError.message),
        salidas: new Map<string, number>(),
        nombrePorId,
      };
    }
    for (const fila of nombresInsumo ?? []) {
      nombrePorId.set(fila.id, fila.nombre);
    }
  }

  return { error: null, salidas, nombrePorId };
}

export async function validarExistenciasParaSalidas(
  supabase: SupabaseClient,
  salidas: Map<string, number>,
  nombrePorId: Map<string, string>,
) {
  for (const [productoId, cantidadNecesaria] of salidas) {
    const { data: existencia, error } = await supabase
      .from("existencias")
      .select("id, cantidad")
      .eq("producto_id", productoId)
      .maybeSingle();
    if (error) return { error: mensajeLegible(error.message) };
    const stock = Number(existencia?.cantidad ?? 0);
    const etiqueta = nombrePorId.get(productoId) ?? "insumo";
    if (stock < cantidadNecesaria) {
      return {
        error: `No alcanza la existencia de ${etiqueta}. Hay ${stock}, se necesitan ${cantidadNecesaria}.`,
      };
    }
  }
  return { error: null };
}

export async function aplicarSalidasInventarioVenta(
  supabase: SupabaseClient,
  datos: {
    ventaId: string;
    cajaId: string | null;
    folio: string | null;
    salidas: Map<string, number>;
    nombrePorId: Map<string, string>;
    nota: string;
  },
) {
  for (const [productoId, cantidad] of datos.salidas) {
    const { data: existencia, error: leerError } = await supabase
      .from("existencias")
      .select("id, cantidad")
      .eq("producto_id", productoId)
      .maybeSingle();
    if (leerError) return { error: mensajeLegible(leerError.message) };

    const anterior = Number(existencia?.cantidad ?? 0);
    const siguiente = anterior - cantidad;
    if (siguiente < 0) {
      const etiqueta = datos.nombrePorId.get(productoId) ?? "producto";
      return { error: `Existencia insuficiente para ${etiqueta}.` };
    }

    if (existencia) {
      const { error } = await supabase
        .from("existencias")
        .update({ cantidad: siguiente })
        .eq("id", existencia.id);
      if (error) return { error: mensajeLegible(error.message) };
    } else {
      const etiqueta = datos.nombrePorId.get(productoId) ?? "producto";
      return { error: `No hay fila de existencia para ${etiqueta}.` };
    }

    const { error: movError } = await supabase
      .from("movimientos_inventario")
      .insert({
        producto_id: productoId,
        caja_id: datos.cajaId,
        venta_id: datos.ventaId,
        tipo: "salida_venta",
        cantidad,
        nota: datos.nota,
      });
    if (movError) return { error: mensajeLegible(movError.message) };
  }
  return { error: null };
}