-- Käivita Supabase SQL Editoris PÄRAST migration-002-groups.sql
-- Lubab liikmel muuta oma mängijanime grupis

create or replace function public.update_my_group_nickname(
  p_group_id uuid,
  p_nickname text
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

  if length(trim(p_nickname)) < 2 then
    raise exception 'Mängijanimi peab olema vähemalt 2 tähemärki';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'Sa pole selle grupi liige';
  end if;

  update public.group_members
  set nickname = trim(p_nickname)
  where group_id = p_group_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.update_my_group_nickname(uuid, text) to authenticated;
