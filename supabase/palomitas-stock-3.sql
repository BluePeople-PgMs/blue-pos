-- 3 combos Palomitas disponibles (1 unidad de cada componente por combo).
-- Ejecutar en Supabase → SQL Editor → Run.

insert into public.existencias (producto_id, cantidad)
values
  ('d4000004-0004-4004-8004-000000000006', 3), -- Agua naturale 1L
  ('852cb7a9-fe2e-413f-bb2c-0b8a542ad586', 3), -- Aranciata 330 ml
  ('e17b77c1-fba1-4fc0-a6db-bbfcaa7db723', 3)  -- Birra Chiara 330 ml
on conflict (producto_id) do update
  set cantidad = excluded.cantidad;