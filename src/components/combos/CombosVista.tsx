"use client";

import { useCallback, useEffect, useState } from "react";
import {
  etiquetaRol,
  generarCombos,
  listarCombos,
  type ComboVista,
  type RolCombo,
} from "@/lib/combos";

function dinero(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

function origenTipo(tipo: string) {
  if (tipo === "preparado") return "Comida preparada";
  if (tipo === "directo") return "Producto terminado";
  return tipo;
}

function faltanRoles(componentes: ComboVista["componentes"]) {
  const roles = new Set(componentes.map((c) => c.rol));
  const requeridos: RolCombo[] = ["entrada", "bebida", "plato_fuerte"];
  return requeridos.filter((rol) => !roles.has(rol));
}

export function CombosVista() {
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [combos, setCombos] = useState<ComboVista[]>([]);

  const recargar = useCallback(async () => {
    const { error, combos: lista } = await listarCombos();
    setAviso(error);
    setCombos(lista);
    setCargando(false);
  }, []);

  useEffect(() => {
    let activo = true;
    listarCombos().then(({ error, combos: lista }) => {
      if (!activo) return;
      setAviso(error);
      setCombos(lista);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  async function onGenerar() {
    setGenerando(true);
    setExito(null);
    setAviso(null);
    const { error, creados } = await generarCombos();
    if (error) {
      setAviso(error);
    } else {
      setExito(
        creados === 1
          ? "Se creó 1 combo."
          : `Se crearon ${creados} combos (cada uno con entrada, bebida y plato fuerte).`,
      );
    }
    await recargar();
    setGenerando(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-base font-semibold">Armar combos</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Cada combo reúne una{" "}
          <span className="font-medium text-foreground">entrada</span> de comidas
          preparadas, una{" "}
          <span className="font-medium text-foreground">bebida</span> (de la
          casa o empacada) y un{" "}
          <span className="font-medium text-foreground">plato fuerte</span>{" "}
          (pastas, pizzas, risottos o platos fuertes). El precio del combo es
          el 90&nbsp;% de la suma de los tres productos.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={generando}
            onClick={() => void onGenerar()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {generando ? "Generando…" : "Generar combos"}
          </button>
          {combos.length > 0 ? (
            <p className="text-sm text-muted">
              Al regenerar se reemplazan los combos anteriores.
            </p>
          ) : null}
        </div>
        {exito ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-olive/30 bg-olive-soft px-4 py-3 text-sm text-olive"
          >
            {exito}
          </p>
        ) : null}
        {aviso ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {aviso}
          </p>
        ) : null}
      </section>

      {cargando ? (
        <p
          role="status"
          className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
        >
          Cargando combos…
        </p>
      ) : combos.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
        >
          Todavía no hay combos. Pulsa &ldquo;Generar combos&rdquo; para armarlos
          desde los catálogos.
        </p>
      ) : (
        <ul className="grid gap-4">
          {combos.map((combo) => {
            const incompleto = faltanRoles(combo.componentes);
            return (
              <li
                key={combo.id}
                className="rounded-2xl border border-line bg-card px-5 py-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{combo.nombre}</h3>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {combo.codigo}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{dinero(combo.precio)}</p>
                </div>
                {incompleto.length > 0 ? (
                  <p className="mt-3 text-sm text-warn">
                    Falta: {incompleto.map(etiquetaRol).join(", ")}
                  </p>
                ) : null}
                <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                  {combo.componentes.map((pieza) => (
                    <li
                      key={`${combo.id}-${pieza.rol}-${pieza.productoId}`}
                      className="rounded-xl border border-line bg-background px-4 py-3"
                    >
                      <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                        {etiquetaRol(pieza.rol)}
                      </p>
                      <p className="mt-1 font-medium leading-6">{pieza.nombre}</p>
                      <p className="mt-1 text-xs text-muted">
                        {origenTipo(pieza.tipo)} · {pieza.categoria}
                      </p>
                      <p className="mt-2 font-mono text-xs text-muted">
                        {pieza.codigo || "—"} · {dinero(pieza.precio)}
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}