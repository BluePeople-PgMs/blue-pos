import type Stripe from "stripe";
import { cobrarVenta } from "@/lib/ventas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { idStripe } from "@/lib/stripe";

const MINIMO_CENTAVOS = 1000;

export function centavosDe(pesos: number) {
  return Math.round(pesos * 100);
}

export function lineasParaCheckout(
  lineas: { producto: string; cantidad: number; subtotal: number }[],
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return lineas.map((linea) => {
    const cantidadTexto =
      linea.cantidad === 1 ? linea.producto : `${linea.cantidad} × ${linea.producto}`;
    return {
      quantity: 1,
      price_data: {
        currency: "mxn",
        unit_amount: centavosDe(linea.subtotal),
        tax_behavior: "inclusive",
        product_data: {
          name: cantidadTexto,
          tax_code: "txcd_40060003",
        },
      },
    };
  });
}

export function esErrorDeImpuesto(error: unknown) {
  const mensaje = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    mensaje.includes("tax") ||
    mensaje.includes("head office") ||
    mensaje.includes("origin address")
  );
}

export async function registrarCobroStripe(datos: {
  supabase: SupabaseClient;
  session: Stripe.Checkout.Session;
}) {
  const ventaId = datos.session.metadata?.venta_id;
  if (!ventaId) return { error: "La sesión de Stripe no trae la venta." };
  if (datos.session.status !== "complete" || datos.session.payment_status !== "paid") {
    return { error: "Stripe todavía no marca este pago como pagado." };
  }
  if (datos.session.currency !== "mxn") {
    return { error: "La sesión de Stripe no está en pesos mexicanos." };
  }

  const monto = (datos.session.amount_total ?? 0) / 100;
  if (monto <= 0) return { error: "Stripe no devolvió un monto cobrado." };

  return cobrarVenta({
    ventaId,
    metodo: "tarjeta",
    cliente: datos.supabase,
    stripe: {
      checkoutSessionId: datos.session.id,
      paymentIntentId: idStripe(datos.session.payment_intent),
      invoiceId: idStripe(datos.session.invoice),
      monto,
    },
  });
}

export { MINIMO_CENTAVOS };
