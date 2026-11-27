#!/usr/bin/env node
/** Aplica migraciones delivery (roles + orders). Requiere SUPABASE_DB_PASSWORD. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) throw new Error("Falta .env.local");
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

async function runSql(client, file) {
  const sql = readFileSync(join(root, file), "utf8");
  console.log(`→ ${file}`);
  await client.query(sql);
}

async function main() {
  const vars = parseEnvLocal();
  const password = vars.SUPABASE_DB_PASSWORD?.trim();
  const ref = vars.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!password || !ref) {
    console.error("Necesitas SUPABASE_DB_PASSWORD y NEXT_PUBLIC_SUPABASE_URL.");
    process.exit(1);
  }
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
  try {
    await runSql(client, "supabase/migrations/20261127110000_perfiles_cuatro_roles.sql");
    await runSql(client, "supabase/migrations/20261127120000_delivery_orders.sql");
    await runSql(client, "supabase/migrations/20261127130000_delivery_enhancements.sql");
    await runSql(client, "supabase/migrations/20261127131000_delivery_repartidor_historico.sql");
    await runSql(client, "supabase/migrations/20261127132000_delivery_realtime.sql");
    await runSql(client, "supabase/migrations/20261127133000_delivery_coordenadas.sql");
    console.log("✓ Migraciones delivery aplicadas");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});