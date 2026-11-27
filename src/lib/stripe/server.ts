import Stripe from "stripe";

export function stripeConfigurado(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Falta STRIPE_SECRET_KEY en .env.local");
  }
  return new Stripe(key);
}