-- Käivita Supabase SQL Editoris PÄRAST migration-011-draw-scoring.sql
-- Parandab punktireeglite salvestamist: üks transaktsioon (seaded + ümberarvutus)

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

  -- Viik: tegelik tulemus on viik, aga ennustati võitjat (mitte viiki)
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
declare
  v_scoring jsonb;
begin
  select gs.scoring into v_scoring
  from public.group_settings gs
  where gs.group_id = p_group_id;

  if v_scoring is null then
    return;
  end if;

  update public.match_predictions mp
  set
    points = public.calculate_prediction_points(
      mp.home_goals,
      mp.away_goals,
      m.home_score,
      m.away_score,
      v_scoring
    ),
    updated_at = now()
  from public.matches m
  join public.prediction_groups pg
    on pg.id = p_group_id
    and pg.tournament_id = m.tournament_id
  where mp.group_id = p_group_id
    and mp.match_id = m.id
    and m.home_score is not null
    and m.away_score is not null;
end;
$$;

create or replace function public.update_group_scoring(
  p_group_id uuid,
  p_exact_score int,
  p_goal_diff int,
  p_tendency int,
  p_draw_points int,
  p_bonus_points int
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

  if not public.is_group_admin(p_group_id) then
    raise exception 'Ainult admin saab punktireegleid muuta';
  end if;

  if p_exact_score < 0
    or p_goal_diff < 0
    or p_tendency < 0
    or p_draw_points < 0
    or p_bonus_points < 0
  then
    raise exception 'Punktid ei saa olla negatiivsed';
  end if;

  update public.group_settings
  set
    scoring = jsonb_build_object(
      'exact_score', p_exact_score,
      'goal_diff', p_goal_diff,
      'tendency', p_tendency,
      'draw_points', p_draw_points,
      'bonus_points', p_bonus_points
    ),
    updated_at = now()
  where group_id = p_group_id;

  perform public.recalculate_group_match_points(p_group_id);
  perform public.recalculate_group_bonus_points(p_group_id);
end;
$$;

grant execute on function public.recalculate_group_match_points(uuid) to authenticated;
grant execute on function public.update_group_scoring(uuid, int, int, int, int, int) to authenticated;

-- Ühekordne ümberarvutus kõigile gruppidele (uuendab viigi punktid juba sisestatud tulemuste juures)
do $$
declare
  v_group_id uuid;
begin
  for v_group_id in select id from public.prediction_groups loop
    perform public.recalculate_group_match_points(v_group_id);
  end loop;
end;
$$;
