#!/usr/bin/env node
/**
 * Aplica migración de 4 roles + handle_new_user (requiere SUPABASE_DB_PASSWORD en .env.local).
 * Uso: npm run migrate:perfiles-roles
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function parseEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    throw new Error("Falta .env.local");
  }
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

async function main() {
  const vars = parseEnvLocal();
  const url = vars.NEXT_PUBLIC_SUPABASE_URL;
  const password = vars.SUPABASE_DB_PASSWORD?.trim();
  if (!url || !password) {
    console.error(
      "Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_DB_PASSWORD en .env.local.\n" +
        "Alternativa: pega supabase/migrations/20261127110000_perfiles_cuatro_roles.sql en el SQL Editor de Supabase.",
    );
    process.exit(1);
  }
  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) {
    throw new Error("URL de Supabase inválida");
  }

  const sql = readFileSync(
    join(root, "supabase/migrations/20261127110000_perfiles_cuatro_roles.sql"),
    "utf8",
  );

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
    console.log("→ Aplicando migración perfiles (4 roles)…");
    await client.query(sql);
    console.log("✓ Migración aplicada");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});