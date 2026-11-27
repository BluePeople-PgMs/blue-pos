#!/usr/bin/env node
/**
 * Stock para combo Palomitas (requiere SUPABASE_DB_PASSWORD o DATABASE_URL en .env.local).
 * Uso: node scripts/seed-palomitas-stock.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) throw new Error("Falta .env.local");
  const vars = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

async function main() {
  const vars = env();
  let password = vars.SUPABASE_DB_PASSWORD;
  const dbUrl = vars.DATABASE_URL;
  if (!password && dbUrl) {
    const u = new URL(dbUrl.replace(/^postgresql:/, "postgres:"));
    password = decodeURIComponent(u.password);
  }
  if (!password) {
    console.error("Agrega SUPABASE_DB_PASSWORD en .env.local o ejecuta supabase/repair-palomitas.sql");
    process.exit(1);
  }
  const ref = vars.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
  if (!ref) throw new Error("URL Supabase inválida");

  const pg = await import("pg");
  const client = new pg.default.Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const sql = readFileSync(join(root, "supabase/palomitas-stock-3.sql"), "utf8");
  await client.query(sql);
  await client.end();
  console.log("✓ Palomitas: componentes y existencias listos.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});