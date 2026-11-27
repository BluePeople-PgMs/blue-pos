import { getStripe, stripeConfigurado } from "@/lib/stripe/server";
import { NextResponse } from "next/server";

type Body = {
  montoMxn?: number;
  ventaId?: string;
};

export async function POST(request: Request) {
  if (!stripeConfigurado()) {
    return NextResponse.json(
      { error: "Stripe no configurado (STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const montoMxn = Number(body.montoMxn);
  const ventaId = body.ventaId?.trim();

  if (!Number.isFinite(montoMxn) || montoMxn <= 0) {
    return NextResponse.json({ error: "montoMxn inválido" }, { status: 400 });
  }
  if (!ventaId) {
    return NextResponse.json({ error: "Falta ventaId" }, { status: 400 });
  }

  const amount = Math.round(montoMxn * 100);
  if (amount < 100) {
    return NextResponse.json(
      { error: "El monto mínimo en Stripe es $1.00 MXN" },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "mxn",
      automatic_payment_methods: { enabled: true },
      metadata: { venta_id: ventaId },
    });

    if (!intent.client_secret) {
      return NextResponse.json(
        { error: "Stripe no devolvió client_secret" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al crear el pago";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}