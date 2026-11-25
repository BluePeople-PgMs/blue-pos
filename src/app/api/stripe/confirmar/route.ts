import { registrarCobroStripe } from "@/lib/cobro-stripe";
import { getStripe, idStripe } from "@/lib/stripe";
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

  const cuerpo = (await request.json().catch(() => null)) as { sessionId?: string } | null;
  const sessionId = cuerpo?.sessionId?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return Response.json({ error: "Falta la sesión de Stripe." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "invoice"],
  });

  const resultado = await registrarCobroStripe({ supabase, session });
  if (resultado.error) {
    return Response.json({ error: resultado.error }, { status: 400 });
  }

  const factura =
    session.invoice && typeof session.invoice === "object"
      ? session.invoice.hosted_invoice_url
      : null;

  return Response.json({
    ok: true,
    ventaId: session.metadata?.venta_id ?? null,
    facturaUrl: factura,
    invoiceId: idStripe(session.invoice),
  });
}
