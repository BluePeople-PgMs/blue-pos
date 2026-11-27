"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/domicilio/nuevo", etiqueta: "1. Recibir pedido" },
  { href: "/domicilio", etiqueta: "2. Tablero" },
];

export function DomicilioEncabezado({
  titulo,
  detalle,
}: {
  titulo: string;
  detalle: string;
}) {
  const ruta = usePathname();

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">
            Pedidos a domicilio
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {titulo}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{detalle}</p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          Inicio
        </Link>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Pantallas de domicilio">
        {ENLACES.map((enlace) => {
          const activo = ruta === enlace.href;
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={activo ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                activo
                  ? "bg-accent text-white"
                  : "bg-card text-muted ring-1 ring-line hover:text-foreground"
              }`}
            >
              {enlace.etiqueta}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
