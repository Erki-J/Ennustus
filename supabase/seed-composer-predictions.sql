-- Täida Composeri (või muu hallatava mängija) tulevased ennustused.
-- Käivita Supabase SQL Editoris. Muuda vajadusel group_id / nickname.

do $$
declare
  v_group_id uuid := '6dad8d9d-2917-4721-8311-d8d1c51b1253';
  v_nickname text := 'Composer';
  v_user_id uuid;
  v_admin_id uuid;
  v_scoring jsonb;
  v_match record;
  v_home int;
  v_away int;
  v_points int;
  v_home_str int;
  v_away_str int;
begin
  select gm.user_id into v_user_id
  from public.group_members gm
  where gm.group_id = v_group_id
    and gm.nickname ilike v_nickname || '%'
  limit 1;

  if v_user_id is null then
    raise exception 'Mängijat % ei leitud grupis', v_nickname;
  end if;

  select gm.user_id into v_admin_id
  from public.group_members gm
  where gm.group_id = v_group_id and gm.role = 'admin'
  order by gm.joined_at
  limit 1;

  select gs.scoring into v_scoring
  from public.group_settings gs
  where gs.group_id = v_group_id;

  for v_match in
    select m.*
    from public.matches m
    join public.prediction_groups pg on pg.tournament_id = m.tournament_id
    where pg.id = v_group_id
      and m.kickoff_at > now()
      and m.home_team <> 'Tundmatu'
      and m.away_team <> 'Tundmatu'
      and m.home_team !~ '^W[0-9]+$'
      and m.away_team !~ '^W[0-9]+$'
      and m.home_team !~ '^L[0-9]+$'
      and m.away_team !~ '^L[0-9]+$'
      and not exists (
        select 1 from public.match_predictions mp
        where mp.group_id = v_group_id
          and mp.user_id = v_user_id
          and mp.match_id = m.id
      )
  loop
    v_home_str := 4;
    v_away_str := 4;

    if v_match.home_team = 'Brasiilia' then v_home_str := 10; end if;
    if v_match.away_team = 'Brasiilia' then v_away_str := 10; end if;
    if v_match.home_team in ('Argentina', 'Prantsusmaa') then v_home_str := 9; end if;
    if v_match.away_team in ('Argentina', 'Prantsusmaa') then v_away_str := 9; end if;
    if v_match.home_team in ('Inglismaa', 'Hispaania', 'Saksamaa') then v_home_str := 8; end if;
    if v_match.away_team in ('Inglismaa', 'Hispaania', 'Saksamaa') then v_away_str := 8; end if;

    if v_match.home_team = 'Brasiilia' then
      v_home := 2; v_away := 0;
      if v_away_str >= 5 then v_home := 2; v_away := 1; end if;
    elsif v_match.away_team = 'Brasiilia' then
      v_home := 0; v_away := 2;
      if v_home_str >= 5 then v_home := 1; v_away := 2; end if;
    elsif v_home_str >= v_away_str + 3 then
      v_home := 2; v_away := 0;
    elsif v_away_str >= v_home_str + 3 then
      v_home := 0; v_away := 2;
    elsif v_home_str > v_away_str then
      v_home := 2; v_away := 1;
    elsif v_away_str > v_home_str then
      v_home := 1; v_away := 2;
    else
      v_home := 1; v_away := 1;
    end if;

    v_points := 0;
    if v_match.home_score is not null and v_match.away_score is not null then
      v_points := public.calculate_prediction_points(
        v_home, v_away, v_match.home_score, v_match.away_score, v_scoring
      );
    end if;

    insert into public.match_predictions (
      group_id, user_id, match_id, home_goals, away_goals,
      points, last_modified_by, modified_by_admin
    )
    values (
      v_group_id, v_user_id, v_match.id, v_home, v_away,
      v_points, v_admin_id, true
    );
  end loop;
end $$;
