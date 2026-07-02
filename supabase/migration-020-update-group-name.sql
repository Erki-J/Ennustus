-- Käivita Supabase SQL Editoris PÄRAST migration-007-update-nickname.sql
-- Lubab grupi adminil muuta ennustusgrupi nime

create or replace function public.update_group_name(
  p_group_id uuid,
  p_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Grupi nimi peab olema vähemalt 2 tähemärki';
  end if;

  if not public.is_group_admin(p_group_id) then
    raise exception 'Ainult grupi admin saab grupi nime muuta';
  end if;

  update public.prediction_groups
  set name = trim(p_name)
  where id = p_group_id;
end;
$$;

grant execute on function public.update_group_name(uuid, text) to authenticated;
