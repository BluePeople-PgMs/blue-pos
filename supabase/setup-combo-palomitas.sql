-- Stock mínimo para que el combo Palomitas aparezca en /pedidos (componentes ya ligados).
-- Ejecutar en SQL Editor si el combo no sale por stock 0.

insert into public.existencias (producto_id, cantidad)
select v.producto_id, v.cantidad
from (values
  ('d4000004-0004-4004-8004-000000000006'::uuid, 120), -- Agua naturale 1L
  ('852cb7a9-fe2e-413f-bb2c-0b8a542ad586'::uuid, 80),  -- Aranciata 330 ml
  ('e17b77c1-fba1-4fc0-a6db-bbfcaa7db723'::uuid, 60)   -- Birra Chiara 330 ml
) as v(producto_id, cantidad)
on conflict (producto_id) do update
  set cantidad = greatest(public.existencias.cantidad, excluded.cantidad);