-- Después de la migración de 4 roles: corrige cuentas QA creadas como mesero por error.
-- Ajusta los correos si usaste otros en las pruebas.

update public.perfiles p
set rol = 'cliente'
from auth.users u
where p.id = u.id
  and u.email = 'fer.cliente.qa+271127@bluepeople.com';

update public.perfiles p
set rol = 'repartidor'
from auth.users u
where p.id = u.id
  and u.email = 'fer.repartidor.qa+271127@bluepeople.com';

update public.perfiles p
set rol = 'cliente'
from auth.users u
where p.id = u.id
  and u.email = 'fjimenezcliente@bluepeople.com';

update public.perfiles p
set rol = 'cliente'
from auth.users u
where p.id = u.id
  and u.email = 'fjimenezcliente_test@bluepeople.com';