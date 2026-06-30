-- Käivita Supabase SQL Editoris PÄRAST migration-003-matches-predictions.sql
-- Ülevaates nähtav: kas ennustus on olemas (kriips enne kickoff'i), skoor alles pärast algust

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
    case when m.kickoff_at <= now() then mp.points else 0 end as points
  from public.match_predictions mp
  join public.matches m on m.id = mp.match_id
  where mp.group_id = p_group_id
    and mp.match_id = any(p_match_ids)
    and public.is_group_member(p_group_id);
$$;

create or replace function public.get_overview_match_point_totals(p_group_id uuid)
returns table (
  user_id uuid,
  total_points int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.user_id,
    coalesce(sum(mp.points), 0)::int as total_points
  from public.match_predictions mp
  where mp.group_id = p_group_id
    and public.is_group_member(p_group_id)
  group by mp.user_id;
$$;

grant execute on function public.get_overview_round_predictions(uuid, uuid[]) to authenticated;
grant execute on function public.get_overview_match_point_totals(uuid) to authenticated;
