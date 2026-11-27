"use client";

import { stripePublicadoEnCliente } from "@/lib/stripe/cliente";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const stripePromise = stripePublicadoEnCliente()
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  : null;

type ModalPagoStripeProps = {
  ventaId: string;
  montoMxn: number;
  formatoMoneda: (monto: number) => string;
  onExito: (paymentIntentId: string) => void;
  onCerrar: () => void;
};

export function ModalPagoStripe(props: ModalPagoStripeProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripePromise) {
      return;
    }
    let activo = true;
    setError(null);
    setClientSecret(null);

    void fetch("/api/stripe/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        montoMxn: props.montoMxn,
        ventaId: props.ventaId,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          clientSecret?: string;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo iniciar el pago");
        }
        if (!data.clientSecret) {
          throw new Error("Respuesta sin clientSecret");
        }
        if (activo) {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((e) => {
        if (activo) {
          setError(e instanceof Error ? e.message : "Error de red");
        }
      });

    return () => {
      activo = false;
    };
  }, [props.montoMxn, props.ventaId]);

  if (!stripePromise) {
    return null;
  }

  return (
    <div
      className="overlay-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={props.onCerrar}
    >
      <div
        className="cine-panel max-h-[90dvh] w-full max-w-md overflow-y-auto p-5"
        role="dialog"
        aria-labelledby="stripe-pago-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="stripe-pago-titulo" className="text-lg font-bold text-foreground">
          Pago con tarjeta (Stripe)
        </h2>
        <p className="mt-1 text-sm text-muted">
          Total: {props.formatoMoneda(props.montoMxn)} · modo prueba
        </p>
        {error ? (
          <p className="mt-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {!clientSecret ? (
          <p className="mt-4 text-sm text-muted">Preparando formulario de pago…</p>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, locale: "es" }}
          >
            <FormularioStripe {...props} clientSecret={clientSecret} />
          </Elements>
        )}
        {!clientSecret ? (
          <button
            type="button"
            onClick={props.onCerrar}
            className="mt-4 min-h-11 w-full rounded-lg border border-line text-sm font-medium"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FormularioStripe({
  onExito,
  onCerrar,
  clientSecret,
}: ModalPagoStripeProps & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function confirmar() {
    if (!stripe || !elements) {
      return;
    }
    setProcesando(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setProcesando(false);
      setError(submitError.message ?? "Revisa los datos de la tarjeta");
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/pedidos`,
      },
      redirect: "if_required",
    });

    setProcesando(false);

    if (confirmError) {
      setError(confirmError.message ?? "El pago no se completó");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onExito(paymentIntent.id);
      return;
    }

    setError(`Estado del pago: ${paymentIntent?.status ?? "desconocido"}`);
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!stripe || !elements || procesando}
          onClick={() => void confirmar()}
          className="cine-btn-primary min-h-11 flex-1 text-sm disabled:opacity-60"
        >
          {procesando ? "Procesando…" : "Confirmar pago"}
        </button>
        <button
          type="button"
          disabled={procesando}
          onClick={onCerrar}
          className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-muted">
        Tarjeta de prueba: 4242 4242 4242 4242 · cualquier fecha y CVC.
      </p>
    </div>
  );
}