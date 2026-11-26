import { esErrorDeImpuesto, lineasParaCheckout, MINIMO_CENTAVOS, centavosDe } from "@/lib/cobro-stripe";
import { getStripe } from "@/lib/stripe";
import { exigirUsuario } from "@/lib/supabase-servidor";
import { leerVenta } from "@/lib/ventas";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return Response.json(
      { error: "Falta STRIPE_SECRET_KEY en el servidor." },
      { status: 500 },
    );
  }

  const { supabase, error: sesionError } = await exigirUsuario(request);
  if (!supabase) {
    return Response.json({ error: sesionError }, { status: 401 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { ventaId?: string } | null;
  const ventaId = cuerpo?.ventaId?.trim() ?? "";
  if (!ventaId) {
    return Response.json({ error: "Falta la venta." }, { status: 400 });
  }

  const detalle = await leerVenta(ventaId, supabase);
  if (detalle.error || !detalle.venta) {
    return Response.json(
      { error: detalle.error ?? "Venta no encontrada." },
      { status: 400 },
    );
  }
  if (detalle.venta.estado !== "abierta") {
    return Response.json({ error: "Solo puedes cobrar una venta abierta." }, { status: 400 });
  }
  if (detalle.venta.lineasDetalle.length === 0) {
    return Response.json({ error: "Agrega al menos una línea antes de cobrar." }, { status: 400 });
  }

  const centavos = centavosDe(detalle.venta.total);
  if (centavos < MINIMO_CENTAVOS) {
    return Response.json(
      { error: "Stripe pide un mínimo de $10.00 MXN para cobrar con tarjeta." },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const lineas = lineasParaCheckout(detalle.venta.lineasDetalle);
  const base = {
    ui_mode: "elements" as const,
    mode: "payment" as const,
    currency: "mxn",
    billing_address_collection: "auto" as const,
    customer_creation: "if_required" as const,
    allowed_payment_method_types: ["card"],
    invoice_creation: { enabled: true },
    line_items: lineas,
    metadata: { venta_id: ventaId },
    payment_intent_data: { metadata: { venta_id: ventaId } },
    return_url: `${origin}/ventas?sesion_stripe={CHECKOUT_SESSION_ID}`,
  };

  try {
    const session = await stripe.checkout.sessions.create(
      { ...base, automatic_tax: { enabled: true } },
      { idempotencyKey: `checkout-${ventaId}-${centavos}-tarjeta-permitida` },
    );
    if (!session.client_secret) {
      return Response.json({ error: "Stripe no devolvió el formulario de pago." }, { status: 502 });
    }
    return Response.json({
      clientSecret: session.client_secret,
      impuestoActivo: true,
    });
  } catch (error) {
    if (!esErrorDeImpuesto(error)) {
      const mensaje = error instanceof Error ? error.message : "No se pudo abrir Stripe.";
      return Response.json({ error: mensaje }, { status: 502 });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create(
      { ...base, automatic_tax: { enabled: false } },
      { idempotencyKey: `checkout-${ventaId}-${centavos}-sin-iva` },
    );
    if (!session.client_secret) {
      return Response.json({ error: "Stripe no devolvió el formulario de pago." }, { status: 502 });
    }
    return Response.json({
      clientSecret: session.client_secret,
      impuestoActivo: false,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo abrir Stripe.";
    return Response.json({ error: mensaje }, { status: 502 });
  }
}
