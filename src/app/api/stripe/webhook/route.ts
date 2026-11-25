import { createClient } from "@supabase/supabase-js";
import { registrarCobroStripe } from "@/lib/cobro-stripe";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secreto = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secreto) {
    return Response.json(
      { error: "Faltan STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET." },
      { status: 500 },
    );
  }

  const firma = request.headers.get("stripe-signature");
  if (!firma) {
    return Response.json({ error: "Falta la firma de Stripe." }, { status: 400 });
  }

  const cuerpo = await request.text();
  let evento;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, firma, secreto);
  } catch {
    return Response.json({ error: "Firma de webhook inválida." }, { status: 400 });
  }

  if (evento.type !== "checkout.session.completed") {
    return Response.json({ recibido: true });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRole) {
    return Response.json({
      recibido: true,
      sincronizado: false,
    });
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const session = evento.data.object;
  const resultado = await registrarCobroStripe({ supabase, session });
  if (resultado.error) {
    return Response.json({ error: resultado.error }, { status: 409 });
  }
  return Response.json({ recibido: true, sincronizado: true });
}
