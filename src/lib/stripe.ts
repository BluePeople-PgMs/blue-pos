import Stripe from "stripe";

let cliente: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cliente !== undefined) return cliente;
  const clave = process.env.STRIPE_SECRET_KEY?.trim();
  if (!clave) {
    cliente = null;
    return null;
  }
  cliente = new Stripe(clave);
  return cliente;
}

export function idStripe(
  valor: string | { id: string } | null | undefined,
): string | null {
  if (!valor) return null;
  return typeof valor === "string" ? valor : valor.id;
}
