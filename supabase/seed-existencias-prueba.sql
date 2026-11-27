-- Stock inicial para capacitación (ejecutar en SQL Editor si el catálogo ya existe).
-- No toca productos ni combos.

insert into public.existencias (producto_id, cantidad)
select p.id,
  case
    when p.tipo = 'insumo' then 800
    when p.tipo = 'combo' then 0
    else 48 + (abs(hashtext(p.id::text)) % 12) * 4
  end
from public.productos p
where p.tipo <> 'combo'
  and not exists (
    select 1 from public.existencias e where e.producto_id = p.id
  );