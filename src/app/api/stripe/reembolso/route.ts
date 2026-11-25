import { getStripe } from "@/lib/stripe";
import { exigirUsuario } from "@/lib/supabase-servidor";

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

  const cuerpo = (await request.json().catch(() => null)) as {
    ventaId?: string;
    paymentIntentId?: string;
  } | null;
  const ventaId = cuerpo?.ventaId?.trim() ?? "";
  const paymentIntentId = cuerpo?.paymentIntentId?.trim() ?? "";
  if (!ventaId || !paymentIntentId.startsWith("pi_")) {
    return Response.json({ error: "Falta el pago de Stripe a reembolsar." }, { status: 400 });
  }

  const { data: pago, error } = await supabase
    .from("pagos")
    .select("id, stripe_payment_intent_id")
    .eq("venta_id", ventaId)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (!pago) {
    return Response.json(
      { error: "Esa venta no tiene este cargo de Stripe." },
      { status: 400 },
    );
  }

  try {
    await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `reembolso-${paymentIntentId}` },
    );
  } catch (errorReembolso) {
    const mensaje =
      errorReembolso instanceof Error
        ? errorReembolso.message
        : "Stripe no pudo reembolsar.";
    if (!mensaje.toLowerCase().includes("already been refunded")) {
      return Response.json({ error: mensaje }, { status: 502 });
    }
  }

  return Response.json({ ok: true });
}
