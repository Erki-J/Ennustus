-- Käivita Supabase SQL Editoris PÄRAST migration-017-locale-et-en.sql
-- Cron skooride uuendus (service_role)

create or replace function public.cron_set_match_result(
  p_match_id uuid,
  p_home_score int,
  p_away_score int,
  p_status public.match_status default 'finished'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_home_score < 0 or p_away_score < 0 then
    raise exception 'Skoor ei saa olla negatiivne';
  end if;

  if not exists (select 1 from public.matches where id = p_match_id) then
    raise exception 'Mängu ei leitud';
  end if;

  update public.matches
  set
    home_score = p_home_score,
    away_score = p_away_score,
    status = p_status
  where id = p_match_id;

  if p_status = 'finished' then
    perform public.recalculate_match_points(p_match_id);
  end if;
end;
$$;

revoke all on function public.cron_set_match_result(uuid, int, int, public.match_status) from public;
grant execute on function public.cron_set_match_result(uuid, int, int, public.match_status) to service_role;
