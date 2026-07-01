-- Käivita Supabase SQL Editoris PÄRAST migration-018-cron-match-results.sql
-- Punkte näidata ainult lõpliku tulemuse korral; cron saab grupi punkte ümber arvutada

create or replace function public.get_overview_round_predictions(
  p_group_id uuid,
  p_match_ids uuid[]
)
returns table (
  user_id uuid,
  match_id uuid,
  home_goals int,
  away_goals int,
  points int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.user_id,
    mp.match_id,
    case when m.kickoff_at <= now() then mp.home_goals else null end as home_goals,
    case when m.kickoff_at <= now() then mp.away_goals else null end as away_goals,
    case
      when m.home_score is not null and m.away_score is not null then mp.points
      else 0
    end as points
  from public.match_predictions mp
  join public.matches m on m.id = mp.match_id
  where mp.group_id = p_group_id
    and mp.match_id = any(p_match_ids)
    and public.is_group_member(p_group_id);
$$;

grant execute on function public.recalculate_group_match_points(uuid) to service_role;
grant execute on function public.recalculate_match_points(uuid) to service_role;

do $$
declare
  v_group_id uuid;
begin
  for v_group_id in select id from public.prediction_groups loop
    perform public.recalculate_group_match_points(v_group_id);
  end loop;
end;
$$;
