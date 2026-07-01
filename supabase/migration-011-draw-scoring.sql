-- Käivita Supabase SQL Editoris PÄRAST migration-006-bonus-scoring.sql
-- Viigi punktid: kui tegelik tulemus on viik, aga mängija ei ennustanud viiki

update public.group_settings
set scoring = scoring || '{"draw_points": 2}'::jsonb
where not (scoring ? 'draw_points');

alter table public.group_settings
  alter column scoring set default '{"exact_score": 4, "goal_diff": 3, "tendency": 2, "draw_points": 2, "bonus_points": 4}'::jsonb;

create or replace function public.calculate_prediction_points(
  p_home_goals int,
  p_away_goals int,
  p_actual_home int,
  p_actual_away int,
  p_scoring jsonb
)
returns int
language plpgsql
immutable
as $$
declare
  v_exact int := coalesce((p_scoring ->> 'exact_score')::int, 4);
  v_diff int := coalesce((p_scoring ->> 'goal_diff')::int, 3);
  v_tendency int := coalesce((p_scoring ->> 'tendency')::int, 2);
  v_draw int := coalesce((p_scoring ->> 'draw_points')::int, 2);
  v_pred_diff int;
  v_actual_diff int;
begin
  if p_actual_home is null or p_actual_away is null then
    return 0;
  end if;

  if p_home_goals = p_actual_home and p_away_goals = p_actual_away then
    return v_exact;
  end if;

  v_pred_diff := p_home_goals - p_away_goals;
  v_actual_diff := p_actual_home - p_actual_away;

  if v_pred_diff = v_actual_diff then
    return v_diff;
  end if;

  if v_actual_diff = 0 and v_pred_diff <> 0 then
    return v_draw;
  end if;

  if sign(v_pred_diff) = sign(v_actual_diff) then
    return v_tendency;
  end if;

  return 0;
end;
$$;

create or replace function public.recalculate_group_match_points(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.match_predictions mp
  set
    points = public.calculate_prediction_points(
      mp.home_goals,
      mp.away_goals,
      m.home_score,
      m.away_score,
      gs.scoring
    ),
    updated_at = now()
  from public.matches m
  join public.prediction_groups pg on pg.tournament_id = m.tournament_id
  join public.group_settings gs on gs.group_id = pg.id
  where mp.group_id = p_group_id
    and mp.match_id = m.id
    and pg.id = p_group_id
    and m.home_score is not null
    and m.away_score is not null;
end;
$$;

grant execute on function public.recalculate_group_match_points(uuid) to authenticated;
