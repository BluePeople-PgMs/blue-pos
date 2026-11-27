"use client";

import Link from "next/link";
import type { RolSistema } from "@/lib/roles";
import { useRol } from "@/components/contexto/RolContext";

type Accion = {
  href: string;
  titulo: string;
  detalle: string;
  emoji: string;
  destacado?: boolean;
  roles: RolSistema[];
};

const ACCIONES: Accion[] = [
  {
    href: "/ventas",
    titulo: "Cobrar una venta",
    detalle: "Arma el carrito, elige pago y revisa el folio.",
    emoji: "🧾",
    destacado: true,
    roles: ["cajero", "administrador"],
  },
  {
    href: "/domicilio/nuevo",
    titulo: "Pedido a domicilio",
    detalle: "Recibe el pedido y síguelo hasta la entrega.",
    emoji: "🛵",
    roles: ["cajero", "administrador"],
  },
  {
    href: "/catalogos",
    titulo: "Ver catálogo",
    detalle: "Comidas y productos de mostrador (solo consulta).",
    emoji: "📋",
    roles: ["cajero", "administrador"],
  },
  {
    href: "/inventario",
    titulo: "Entrar mercancía",
    detalle: "Administración: suma existencia antes de vender.",
    emoji: "📦",
    roles: ["administrador"],
  },
  {
    href: "/pagos",
    titulo: "Historial de cobros",
    detalle: "Administración: revisa pagos por folio.",
    emoji: "💳",
    roles: ["administrador"],
  },
  {
    href: "/cancelaciones",
    titulo: "Historial de cancelaciones",
    detalle: "Administración: motivos y fechas.",
    emoji: "↩️",
    roles: ["administrador"],
  },
];

export function InicioAcciones() {
  const { rol, estado, etiqueta } = useRol();
  const rolActivo = estado === "listo" ? rol : "cajero";
  const visibles = ACCIONES.filter((a) => a.roles.includes(rolActivo));

  return (
    <section className="flex flex-col gap-4" aria-labelledby="acciones-titulo">
      <div>
        <h2 id="acciones-titulo" className="text-xl font-semibold">
          {rolActivo === "cajero"
            ? "Tu turno de caja"
            : "¿Qué quieres hacer?"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {rolActivo === "cajero"
            ? "Como cajero puedes cobrar, tomar pedidos a domicilio y consultar el catálogo. Inventario y reportes los ve administración."
            : "Como administrador tienes acceso a inventario, cobros y cancelaciones."}{" "}
          {estado === "listo" ? (
            <span className="font-medium text-foreground">Rol: {etiqueta}.</span>
          ) : null}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {visibles.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex h-full flex-col gap-2 rounded-2xl border px-5 py-5 transition-shadow hover:shadow-md ${
                item.destacado
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-card hover:border-accent/30"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <span className="text-lg font-semibold leading-snug">
                {item.titulo}
              </span>
              <span className="text-sm leading-relaxed text-muted">
                {item.detalle}
              </span>
              <span
                className={`mt-auto text-sm font-semibold ${
                  item.destacado ? "text-accent" : "text-foreground"
                }`}
              >
                Ir →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}