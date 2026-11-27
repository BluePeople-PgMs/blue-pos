-- Mínimo para probar la pantalla /repartidor/delivery (pega en SQL Editor).
-- Cambia el correo si usas otra cuenta.

alter table public.perfiles drop constraint if exists perfiles_rol;

alter table public.perfiles
  add constraint perfiles_rol
  check (rol in ('cliente', 'mesero', 'administrador', 'repartidor'));

update public.perfiles p
set rol = 'repartidor'
from auth.users u
where p.id = u.id
  and u.email = 'fjimenez@bluepeople.com';