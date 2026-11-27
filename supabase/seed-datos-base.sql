-- Datos base Blue POS (capacitación). Ejecutar después del cascarón y migraciones.
-- IDs estables para que los combos enlacen por nombre en el script de provisión.

insert into public.cajas (nombre, activa)
select v.nombre, v.activa
from (values
  ('Caja 1', true),
  ('Caja 2', true),
  ('Caja 3', true),
  ('Caja 4', true)
) as v(nombre, activa)
where not exists (select 1 from public.cajas c where c.nombre = v.nombre);

insert into public.categorias (nombre, orden)
select v.nombre, v.orden
from (values
  ('Pizza', 1),
  ('Pasta', 2),
  ('Bebidas', 3),
  ('Antipasti', 4),
  ('Postres', 5),
  ('Despensa', 6),
  ('Insumos', 7)
) as v(nombre, orden)
where not exists (select 1 from public.categorias c where c.nombre = v.nombre);

insert into public.unidades (nombre, abreviatura)
select v.nombre, v.abreviatura
from (values
  ('Pieza', 'pz'),
  ('Kilogramo', 'kg'),
  ('Litro', 'L'),
  ('Gramo', 'g')
) as v(nombre, abreviatura)
where not exists (select 1 from public.unidades u where u.nombre = v.nombre);