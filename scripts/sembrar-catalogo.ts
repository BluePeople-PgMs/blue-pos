import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  categorias,
  productos,
  unidades,
} from "../src/data/catalogo-italiano.ts";

function leerEnvLocal() {
  const texto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const valores = new Map<string, string>();
  for (const linea of texto.split("\n")) {
    const limpio = linea.trim();
    if (!limpio || limpio.startsWith("#")) continue;
    const corte = limpio.indexOf("=");
    if (corte === -1) continue;
    valores.set(limpio.slice(0, corte), limpio.slice(corte + 1));
  }
  return valores;
}

async function insertarEnLotes(
  supabase: ReturnType<typeof createClient>,
  tabla: "categorias" | "unidades" | "productos",
  filas: Record<string, unknown>[],
) {
  for (let inicio = 0; inicio < filas.length; inicio += 50) {
    const lote = filas.slice(inicio, inicio + 50);
    const { error } = await supabase.from(tabla).insert(lote);
    if (error) {
      throw new Error(`${tabla}: ${error.message}`);
    }
  }
}

async function main() {
  const env = leerEnvLocal();
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const key = env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    throw new Error("Faltan las variables en .env.local");
  }

  const codigos = new Set<string>();
  const nombresCategoria = new Set(categorias.map((categoria) => categoria.nombre));
  const clavesUnidad = new Set(unidades.map((unidad) => unidad.clave));
  for (const producto of productos) {
    if (codigos.has(producto.codigo)) {
      throw new Error(`Código repetido: ${producto.codigo}`);
    }
    codigos.add(producto.codigo);
    if (!nombresCategoria.has(producto.categoria)) {
      throw new Error(`Categoría desconocida en ${producto.codigo}`);
    }
    if (!clavesUnidad.has(producto.unidad)) {
      throw new Error(`Unidad desconocida en ${producto.codigo}`);
    }
  }

  const supabase = createClient(url, key);

  const [categoriasActuales, unidadesActuales, productosActuales] =
    await Promise.all([
      supabase.from("categorias").select("id, nombre"),
      supabase.from("unidades").select("id, nombre"),
      supabase.from("productos").select("codigo"),
    ]);

  if (categoriasActuales.error) throw new Error(categoriasActuales.error.message);
  if (unidadesActuales.error) throw new Error(unidadesActuales.error.message);
  if (productosActuales.error) throw new Error(productosActuales.error.message);

  const categoriaPorNombre = new Map(
    (categoriasActuales.data ?? []).map((fila) => [fila.nombre, fila.id]),
  );
  const unidadPorNombre = new Map(
    (unidadesActuales.data ?? []).map((fila) => [fila.nombre, fila.id]),
  );
  const codigosExistentes = new Set(
    (productosActuales.data ?? []).map((fila) => fila.codigo),
  );

  const categoriasNuevas = categorias.filter(
    (categoria) => !categoriaPorNombre.has(categoria.nombre),
  );
  if (categoriasNuevas.length > 0) {
    const { data, error } = await supabase
      .from("categorias")
      .insert(
        categoriasNuevas.map((categoria) => ({
          nombre: categoria.nombre,
          orden: categoria.orden,
        })),
      )
      .select("id, nombre");
    if (error) throw new Error(`categorias: ${error.message}`);
    for (const fila of data ?? []) categoriaPorNombre.set(fila.nombre, fila.id);
  }

  const unidadesNuevas = unidades.filter(
    (unidad) => !unidadPorNombre.has(unidad.nombre),
  );
  if (unidadesNuevas.length > 0) {
    const { data, error } = await supabase
      .from("unidades")
      .insert(
        unidadesNuevas.map((unidad) => ({
          nombre: unidad.nombre,
          abreviatura: unidad.abreviatura,
        })),
      )
      .select("id, nombre");
    if (error) throw new Error(`unidades: ${error.message}`);
    for (const fila of data ?? []) unidadPorNombre.set(fila.nombre, fila.id);
  }

  const unidadPorClave = new Map(
    unidades.map((unidad) => [unidad.clave, unidad.nombre]),
  );
  const productosNuevos = productos
    .filter((producto) => !codigosExistentes.has(producto.codigo))
    .map((producto) => {
      const categoriaId = categoriaPorNombre.get(producto.categoria);
      const nombreUnidad = unidadPorClave.get(producto.unidad);
      const unidadId = nombreUnidad
        ? unidadPorNombre.get(nombreUnidad)
        : undefined;
      if (!categoriaId || !unidadId) {
        throw new Error(`No se pudo relacionar ${producto.codigo}`);
      }
      return {
        nombre: producto.nombre,
        tipo: producto.tipo,
        categoria_id: categoriaId,
        unidad_id: unidadId,
        precio: producto.precio,
        codigo: producto.codigo,
        activo: true,
      };
    });

  await insertarEnLotes(supabase, "productos", productosNuevos);

  const codigosVigentes = new Set(productos.map((producto) => producto.codigo));
  const sobrantes = (productosActuales.data ?? [])
    .map((fila) => fila.codigo)
    .filter(
      (codigo): codigo is string =>
        Boolean(codigo) && !codigosVigentes.has(codigo),
    );

  for (let inicio = 0; inicio < sobrantes.length; inicio += 40) {
    const lote = sobrantes.slice(inicio, inicio + 40);
    const { error } = await supabase.from("productos").delete().in("codigo", lote);
    if (error) throw new Error(`productos: ${error.message}`);
  }

  const comidas = productos.filter((producto) => producto.tipo === "preparado");
  const terminados = productos.filter((producto) => producto.tipo === "directo");
  console.log(
    `Listo. ${categoriasNuevas.length} categorías nuevas, ${unidadesNuevas.length} unidades nuevas, ${productosNuevos.length} productos nuevos.`,
  );
  console.log(
    `Catálogo: ${comidas.length} comidas preparadas y ${terminados.length} productos terminados. Se quitaron ${sobrantes.length}.`,
  );
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error(mensaje);
  process.exit(1);
});
