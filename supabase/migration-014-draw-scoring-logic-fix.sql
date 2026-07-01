-- Käivita Supabase SQL Editoris PÄRAST migration-013-scoring-recalc-fix.sql
-- Viigi punktid: tegelik viik + ennustatud viik, aga vale skoor (nt 1:1 vs 2:2)
-- Kui tegelik on viik aga ennustati võitjat → 0 punkti

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

  -- Viik: mõlemad viigid, aga skoor erineb (nt tegelik 1:1, ennustus 2:2)
  if v_actual_diff = 0 and v_pred_diff = 0 then
    return v_draw;
  end if;

  if v_pred_diff = v_actual_diff then
    return v_diff;
  end if;

  if sign(v_pred_diff) = sign(v_actual_diff) then
    return v_tendency;
  end if;

  return 0;
end;
$$;

do $$
declare
  v_group_id uuid;
begin
  for v_group_id in select id from public.prediction_groups loop
    perform public.recalculate_group_match_points(v_group_id);
  end loop;
end;
$$;
