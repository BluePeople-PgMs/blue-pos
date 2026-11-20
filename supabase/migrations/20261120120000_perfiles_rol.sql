-- Roles de restaurante en perfiles (mesero | administrador).

alter table public.perfiles
  add column if not exists rol text;

update public.perfiles
set rol = 'mesero'
where rol is null;

alter table public.perfiles
  alter column rol set default 'mesero',
  alter column rol set not null;

alter table public.perfiles
  add constraint perfiles_rol check (rol in ('mesero', 'administrador'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;

  insert into public.perfiles (id, rol)
  values (new.id, 'mesero')
  on conflict (id) do update set rol = coalesce(public.perfiles.rol, 'mesero');

  return new;
end;
$$;

-- Promover administrador (ejemplo):
-- update public.perfiles set rol = 'administrador'
-- where id = (select id from auth.users where email = 'admin@ejemplo.com');