-- Cliente y mesero: actualizaciones en vivo vía Supabase Realtime.

do $$
begin
  alter publication supabase_realtime add table public.delivery_orders;
exception
  when duplicate_object then
    null;
end $$;