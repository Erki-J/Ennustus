-- Käivita Supabase SQL Editoris PÄRAST migration-002-groups.sql

create type public.match_status as enum ('scheduled', 'live', 'finished');

create table public.group_settings (
  group_id uuid primary key references public.prediction_groups (id) on delete cascade,
  scoring jsonb not null default '{"exact_score": 4, "goal_diff": 3, "tendency": 2}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  stage text not null default 'group',
  sort_order int not null default 0,
  home_score int,
  away_score int,
  status public.match_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table public.match_predictions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.prediction_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  home_goals int not null check (home_goals >= 0),
  away_goals int not null check (away_goals >= 0),
  points int not null default 0,
  last_modified_by uuid references public.profiles (id),
  modified_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id, match_id)
);

create index matches_tournament_sort_idx on public.matches (tournament_id, sort_order);
create index match_predictions_group_user_idx on public.match_predictions (group_id, user_id);
create index match_predictions_match_idx on public.match_predictions (match_id);

create or replace function public.create_group_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_settings (group_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_prediction_group_created
  after insert on public.prediction_groups
  for each row execute function public.create_group_settings();

-- Olemasolevate gruppide jaoks
insert into public.group_settings (group_id)
select pg.id
from public.prediction_groups pg
where not exists (
  select 1 from public.group_settings gs where gs.group_id = pg.id
);

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

  if sign(v_pred_diff) = sign(v_actual_diff) then
    return v_tendency;
  end if;

  return 0;
end;
$$;

create or replace function public.recalculate_match_points(p_match_id uuid)
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
  where mp.match_id = p_match_id
    and mp.group_id = pg.id
    and m.id = p_match_id
    and m.home_score is not null
    and m.away_score is not null;
end;
$$;

create or replace function public.save_match_prediction(
  p_group_id uuid,
  p_match_id uuid,
  p_home_goals int,
  p_away_goals int,
  p_as_admin boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_scoring jsonb;
  v_points int := 0;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if p_home_goals < 0 or p_away_goals < 0 then
    raise exception 'Skoor ei saa olla negatiivne';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'Sa pole selle grupi liige';
  end if;

  if p_as_admin and not public.is_group_admin(p_group_id) then
    raise exception 'Ainult admin saab teiste ennustusi muuta';
  end if;

  select m.* into v_match
  from public.matches m
  join public.prediction_groups pg on pg.tournament_id = m.tournament_id
  where m.id = p_match_id and pg.id = p_group_id;

  if not found then
    raise exception 'Mängu ei leitud';
  end if;

  if not p_as_admin and v_match.kickoff_at <= now() then
    raise exception 'Ennustus on lukus — mäng on juba alanud';
  end if;

  select scoring into v_scoring
  from public.group_settings
  where group_id = p_group_id;

  if v_match.home_score is not null and v_match.away_score is not null then
    v_points := public.calculate_prediction_points(
      p_home_goals,
      p_away_goals,
      v_match.home_score,
      v_match.away_score,
      v_scoring
    );
  end if;

  insert into public.match_predictions (
    group_id,
    user_id,
    match_id,
    home_goals,
    away_goals,
    points,
    last_modified_by,
    modified_by_admin
  )
  values (
    p_group_id,
    v_user_id,
    p_match_id,
    p_home_goals,
    p_away_goals,
    v_points,
    v_user_id,
    p_as_admin
  )
  on conflict (group_id, user_id, match_id)
  do update set
    home_goals = excluded.home_goals,
    away_goals = excluded.away_goals,
    points = excluded.points,
    last_modified_by = excluded.last_modified_by,
    modified_by_admin = excluded.modified_by_admin,
    updated_at = now();
end;
$$;

create or replace function public.admin_save_member_prediction(
  p_group_id uuid,
  p_user_id uuid,
  p_match_id uuid,
  p_home_goals int,
  p_away_goals int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_scoring jsonb;
  v_points int := 0;
  v_admin_id uuid := auth.uid();
begin
  if v_admin_id is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if not public.is_group_admin(p_group_id) then
    raise exception 'Ainult admin saab teiste ennustusi muuta';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  ) then
    raise exception 'Kasutaja pole grupi liige';
  end if;

  select m.* into v_match
  from public.matches m
  join public.prediction_groups pg on pg.tournament_id = m.tournament_id
  where m.id = p_match_id and pg.id = p_group_id;

  if not found then
    raise exception 'Mängu ei leitud';
  end if;

  select scoring into v_scoring
  from public.group_settings
  where group_id = p_group_id;

  if v_match.home_score is not null and v_match.away_score is not null then
    v_points := public.calculate_prediction_points(
      p_home_goals,
      p_away_goals,
      v_match.home_score,
      v_match.away_score,
      v_scoring
    );
  end if;

  insert into public.match_predictions (
    group_id,
    user_id,
    match_id,
    home_goals,
    away_goals,
    points,
    last_modified_by,
    modified_by_admin
  )
  values (
    p_group_id,
    p_user_id,
    p_match_id,
    p_home_goals,
    p_away_goals,
    v_points,
    v_admin_id,
    true
  )
  on conflict (group_id, user_id, match_id)
  do update set
    home_goals = excluded.home_goals,
    away_goals = excluded.away_goals,
    points = excluded.points,
    last_modified_by = excluded.last_modified_by,
    modified_by_admin = true,
    updated_at = now();
end;
$$;

create or replace function public.set_match_result(
  p_match_id uuid,
  p_home_score int,
  p_away_score int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  select tournament_id into v_tournament_id
  from public.matches
  where id = p_match_id;

  if not found then
    raise exception 'Mängu ei leitud';
  end if;

  if not exists (
    select 1
    from public.prediction_groups pg
    join public.group_members gm on gm.group_id = pg.id
    where pg.tournament_id = v_tournament_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  ) then
    raise exception 'Ainult turniiri grupi admin saab tulemust sisestada';
  end if;

  update public.matches
  set
    home_score = p_home_score,
    away_score = p_away_score,
    status = 'finished'
  where id = p_match_id;

  perform public.recalculate_match_points(p_match_id);
end;
$$;

alter table public.group_settings enable row level security;
alter table public.matches enable row level security;
alter table public.match_predictions enable row level security;

create policy "group_settings_select_member"
  on public.group_settings for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_settings_update_admin"
  on public.group_settings for update
  to authenticated
  using (public.is_group_admin(group_id));

create policy "matches_select_member"
  on public.matches for select
  to authenticated
  using (
    exists (
      select 1
      from public.prediction_groups pg
      join public.group_members gm on gm.group_id = pg.id
      where pg.tournament_id = matches.tournament_id
        and gm.user_id = auth.uid()
    )
  );

create policy "match_predictions_select_own"
  on public.match_predictions for select
  to authenticated
  using (user_id = auth.uid());

create policy "match_predictions_select_after_kickoff"
  on public.match_predictions for select
  to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_predictions.match_id
        and m.kickoff_at <= now()
        and public.is_group_member(match_predictions.group_id)
    )
  );

grant execute on function public.save_match_prediction(uuid, uuid, int, int, boolean) to authenticated;
grant execute on function public.admin_save_member_prediction(uuid, uuid, uuid, int, int) to authenticated;
grant execute on function public.set_match_result(uuid, int, int) to authenticated;

-- Näidis mängud MM 2026 jaoks (testimiseks)
insert into public.matches (tournament_id, home_team, away_team, kickoff_at, stage, sort_order, home_score, away_score, status)
select
  t.id,
  v.home_team,
  v.away_team,
  v.kickoff_at::timestamptz,
  v.stage,
  v.sort_order,
  v.home_score,
  v.away_score,
  v.status::public.match_status
from public.tournaments t
cross join (
  values
    ('Mehhiko', 'Sudaan', '2026-07-02 18:00:00+00', 'group', 1, null::int, null::int, 'scheduled'),
    ('USA', 'Colombia', '2026-07-05 20:00:00+00', 'group', 2, null::int, null::int, 'scheduled'),
    ('Saksamaa', 'Jaapan', '2026-07-08 17:00:00+00', 'group', 3, null::int, null::int, 'scheduled'),
    ('Eesti', 'Hispaania', '2026-06-25 19:00:00+00', 'group', 4, 1, 2, 'finished'),
    ('Brasiilia', 'Prantsusmaa', '2026-06-28 20:00:00+00', 'group', 5, 2, 2, 'finished')
) as v(home_team, away_team, kickoff_at, stage, sort_order, home_score, away_score, status)
where t.slug = 'wc-2026'
  and not exists (
    select 1 from public.matches m where m.tournament_id = t.id
  );
