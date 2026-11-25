-- Referencias de Stripe en el cobro con tarjeta.
-- Efectivo y transferencia dejan estas columnas vacías.

alter table public.pagos
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_invoice_id text;

create unique index if not exists pagos_stripe_checkout_session_id_key
  on public.pagos (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
