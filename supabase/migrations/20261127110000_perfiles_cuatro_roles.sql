-- Cuatro roles + registro con metadata rol_registro (cliente por defecto).

alter table public.perfiles drop constraint if exists perfiles_rol;

alter table public.perfiles
  add constraint perfiles_rol
  check (rol in ('cliente', 'mesero', 'administrador', 'repartidor'));

alter table public.perfiles
  alter column rol set default 'cliente';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol_solicitado text;
  rol_final text := 'cliente';
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;

  rol_solicitado := lower(trim(coalesce(new.raw_user_meta_data->>'rol_registro', '')));

  if rol_solicitado in ('cliente', 'mesero', 'repartidor') then
    rol_final := rol_solicitado;
  end if;

  insert into public.perfiles (id, rol)
  values (new.id, rol_final)
  on conflict (id) do update
  set rol = coalesce(public.perfiles.rol, excluded.rol);

  return new;
end;
$$;