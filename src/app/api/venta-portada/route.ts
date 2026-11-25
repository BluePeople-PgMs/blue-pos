import { generarPortadaSvg } from "@/lib/ventas/portadaIlustracion";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre")?.trim();
  if (!nombre) {
    return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  }
  const esCombo = searchParams.get("esCombo") === "1";
  const descuentoPct = Number(searchParams.get("descuentoPct") ?? "0");

  const svg = generarPortadaSvg({
    nombre,
    esCombo,
    descuentoPct: Number.isFinite(descuentoPct) ? descuentoPct : 0,
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}