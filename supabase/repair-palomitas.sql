-- Palomitas en /pedidos: componentes + stock mínimo. Pegar todo en SQL Editor y Run.

insert into public.combo_componentes (combo_id, producto_id, cantidad)
select * from (values
  ('2e303d09-60a0-4b5c-9c41-4f262463ca6f'::uuid, 'd4000004-0004-4004-8004-000000000006'::uuid, 1::numeric),
  ('2e303d09-60a0-4b5c-9c41-4f262463ca6f'::uuid, '852cb7a9-fe2e-413f-bb2c-0b8a542ad586'::uuid, 1::numeric),
  ('2e303d09-60a0-4b5c-9c41-4f262463ca6f'::uuid, 'e17b77c1-fba1-4fc0-a6db-bbfcaa7db723'::uuid, 1::numeric)
) as v(combo_id, producto_id, cantidad)
where not exists (
  select 1 from public.combo_componentes cc
  where cc.combo_id = v.combo_id and cc.producto_id = v.producto_id
);

insert into public.existencias (producto_id, cantidad)
select v.producto_id, v.cantidad
from (values
  ('d4000004-0004-4004-8004-000000000006'::uuid, 120::numeric),
  ('852cb7a9-fe2e-413f-bb2c-0b8a542ad586'::uuid, 80::numeric),
  ('e17b77c1-fba1-4fc0-a6db-bbfcaa7db723'::uuid, 60::numeric)
) as v(producto_id, cantidad)
on conflict (producto_id) do update
  set cantidad = greatest(public.existencias.cantidad, excluded.cantidad);