-- El proyecto alojado tiene mailer_autoconfirm = false, así que signUp
-- crea el usuario y no devuelve sesión. Este trigger marca el correo como
-- confirmado en la misma transacción; el cliente inicia sesión enseguida.

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

  insert into public.perfiles (id) values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now())
where email_confirmed_at is null;
