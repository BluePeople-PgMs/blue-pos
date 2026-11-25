"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { getSupabaseBrowser } from "@/lib/supabase";

const clavePublica = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
const stripePromise = clavePublica ? loadStripe(clavePublica) : null;

async function tokenDeSesion() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export function FormularioTarjeta({
  ventaId,
  disabled,
  onCobrado,
}: {
  ventaId: string;
  disabled?: boolean;
  onCobrado: (aviso: string) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [impuestoActivo, setImpuestoActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    void (async () => {
      if (!clavePublica) {
        if (activo) {
          setError("Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en .env.local.");
        }
        return;
      }
      const token = await tokenDeSesion();
      const respuesta = await fetch("/api/stripe/sesion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ventaId }),
      });
      const cuerpo = (await respuesta.json().catch(() => null)) as {
        clientSecret?: string;
        impuestoActivo?: boolean;
        error?: string;
      } | null;
      if (!activo) return;
      if (!respuesta.ok || !cuerpo?.clientSecret) {
        setError(cuerpo?.error ?? "No se pudo preparar el cobro con tarjeta.");
        return;
      }
      setImpuestoActivo(cuerpo.impuestoActivo !== false);
      setClientSecret(cuerpo.clientSecret);
    })();
    return () => {
      activo = false;
    };
  }, [ventaId]);

  if (error) {
    return <AvisoTarjeta texto={error} tono="error" />;
  }
  if (!clientSecret || !stripePromise) {
    return <p className="text-xs text-muted">Preparando el formulario de tarjeta…</p>;
  }

  return (
    <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret }}>
      <PagoDentro
        disabled={disabled}
        impuestoActivo={impuestoActivo}
        onCobrado={onCobrado}
      />
    </CheckoutElementsProvider>
  );
}

function PagoDentro({
  disabled,
  impuestoActivo,
  onCobrado,
}: {
  disabled?: boolean;
  impuestoActivo: boolean;
  onCobrado: (aviso: string) => void;
}) {
  const estado = useCheckoutElements();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pagar() {
    if (estado.type !== "success") return;
    setEnviando(true);
    setError(null);
    const confirmacion = await estado.checkout.confirm({ redirect: "if_required" });
    if (confirmacion.type === "error") {
      setEnviando(false);
      setError(confirmacion.error.message);
      return;
    }
    const token = await tokenDeSesion();
    const respuesta = await fetch("/api/stripe/confirmar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId: confirmacion.session.id }),
    });
    const cuerpo = (await respuesta.json().catch(() => null)) as {
      error?: string;
      facturaUrl?: string | null;
    } | null;
    setEnviando(false);
    if (!respuesta.ok) {
      setError(cuerpo?.error ?? "Stripe cobró, pero la venta no se pudo cerrar.");
      return;
    }
    const factura = cuerpo?.facturaUrl
      ? ` Factura de Stripe: ${cuerpo.facturaUrl}. No sustituye un CFDI.`
      : " El PDF de Stripe no es un CFDI.";
    onCobrado(`Pago con tarjeta registrado.${factura}`);
  }

  if (estado.type === "loading") {
    return <p className="text-xs text-muted">Cargando tarjeta…</p>;
  }
  if (estado.type === "error") {
    return <AvisoTarjeta texto={estado.error.message} tono="error" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <PaymentElement />
      {impuestoActivo ? (
        <p className="text-xs text-muted">
          El IVA va incluido en el precio del menú. Stripe Tax lo desglosa con el
          domicilio del cliente. La factura de Stripe no es un CFDI.
        </p>
      ) : (
        <AvisoTarjeta
          tono="aviso"
          texto="Stripe Tax sigue pendiente: en el entorno de prueba de Blue People falta el domicilio fiscal. Este cobro no calcula IVA."
        />
      )}
      {error ? <AvisoTarjeta texto={error} tono="error" /> : null}
      <button
        type="button"
        disabled={disabled || enviando || !estado.checkout.canConfirm}
        onClick={() => void pagar()}
        className="w-full rounded-xl bg-olive py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
      >
        {enviando ? "Procesando…" : "Pagar con tarjeta"}
      </button>
    </div>
  );
}

function AvisoTarjeta({
  texto,
  tono,
}: {
  texto: string;
  tono: "error" | "aviso";
}) {
  const clase =
    tono === "error"
      ? "border-danger/30 bg-danger-soft text-danger"
      : "border-warn/30 bg-warn-soft text-warn";
  return (
    <p role="status" className={`rounded-xl border px-3 py-2 text-xs ${clase}`}>
      {texto}
    </p>
  );
}
