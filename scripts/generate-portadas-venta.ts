import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  generarPortadaSvg,
  slugComboNombre,
} from "../src/lib/ventas/portadaIlustracion";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outCombos = join(root, "public/combos/portadas");
const outProductos = join(root, "public/productos/portadas");

function parseEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const vars: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

function descuentoPorNumProductos(n: number) {
  if (n >= 5) return 30;
  if (n >= 3) return 20;
  if (n === 2) return 10;
  return 0;
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function catalogoDesdeSupabase() {
  const env = parseEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o KEY en .env.local");
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const [productos, componentes, existencias] = await Promise.all([
    fetchJson(
      `${url}/rest/v1/productos?select=id,nombre,tipo,precio&activo=eq.true&order=nombre`,
      headers,
    ),
    fetchJson(`${url}/rest/v1/combo_componentes?select=combo_id,producto_id`, headers),
    fetchJson(`${url}/rest/v1/existencias?select=producto_id,cantidad`, headers),
  ]);

  const stock = new Map<string, number>(
    existencias.map((f: { producto_id: string; cantidad: number | string }) => [
      f.producto_id,
      Number(f.cantidad),
    ]),
  );

  const conteoCombo = new Map<string, Set<string>>();
  for (const fila of componentes) {
    const set = conteoCombo.get(fila.combo_id) ?? new Set();
    set.add(fila.producto_id);
    conteoCombo.set(fila.combo_id, set);
  }

  const items: {
    nombre: string;
    esCombo: boolean;
    descuentoPct: number;
    outDir: string;
  }[] = [];

  for (const p of productos) {
    const esCombo = p.tipo === "combo";
    if (esCombo) {
      const n = conteoCombo.get(p.id)?.size ?? 0;
      if (n === 0 || p.precio == null) continue;
      items.push({
        nombre: p.nombre,
        esCombo: true,
        descuentoPct: descuentoPorNumProductos(n),
        outDir: outCombos,
      });
      continue;
    }
    if ((stock.get(p.id) ?? 0) <= 0) continue;
    if (p.precio == null) continue;
    items.push({
      nombre: p.nombre,
      esCombo: false,
      descuentoPct: 0,
      outDir: outProductos,
    });
  }

  return items;
}

function escribirPortadas(
  items: { nombre: string; esCombo: boolean; descuentoPct: number; outDir: string }[],
) {
  mkdirSync(outCombos, { recursive: true });
  mkdirSync(outProductos, { recursive: true });

  for (const item of items) {
    const slug = slugComboNombre(item.nombre);
    const file = join(item.outDir, `${slug}.svg`);
    const svg = generarPortadaSvg({
      nombre: item.nombre,
      esCombo: item.esCombo,
      descuentoPct: item.descuentoPct,
    });
    writeFileSync(file, svg, "utf8");
    console.log("✓", file);
  }
}

async function main() {
  const items = await catalogoDesdeSupabase();
  escribirPortadas(items);
  console.log(`Listo: ${items.length} portadas (productos con stock + combos activos).`);
}

void main();