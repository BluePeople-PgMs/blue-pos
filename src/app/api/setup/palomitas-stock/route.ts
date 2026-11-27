import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Solo desarrollo: aplica palomitas-stock-3.sql si hay SUPABASE_DB_PASSWORD. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No disponible en producción" }, { status: 403 });
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const ref = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!password || !ref) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_DB_PASSWORD en .env.local. Alternativa: ejecuta supabase/palomitas-stock-3.sql en el SQL Editor.",
      },
      { status: 503 },
    );
  }

  const sql = readFileSync(
    join(process.cwd(), "supabase/palomitas-stock-3.sql"),
    "utf8",
  );

  try {
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
    await client.query(sql);
    await client.end();
    return NextResponse.json({ ok: true, mensaje: "3 unidades por componente (3 combos Palomitas)." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error SQL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}