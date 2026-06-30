-- Käivita Supabase SQL Editoris PÄRAST migration-003-matches-predictions.sql

create type public.bonus_question_type as enum (
  'group_winner',
  'tournament_winner',
  'top_scorer',
  'semifinalist'
);

create table public.bonus_questions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  question_type public.bonus_question_type not null,
  label text not null,
  group_code text,
  sort_order int not null default 0,
  points_value int not null default 5,
  correct_answer text,
  created_at timestamptz not null default now(),
  unique (tournament_id, question_type, group_code)
);

create table public.bonus_predictions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.prediction_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.bonus_questions (id) on delete cascade,
  answer text not null,
  points int not null default 0,
  last_modified_by uuid references public.profiles (id),
  modified_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id, question_id)
);

create index bonus_predictions_group_user_idx on public.bonus_predictions (group_id, user_id);
create index bonus_questions_tournament_idx on public.bonus_questions (tournament_id, sort_order);

create or replace function public.is_bonus_locked(p_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select min(m.kickoff_at) <= now()
      from public.matches m
      where m.tournament_id = p_tournament_id
    ),
    false
  );
$$;

create or replace function public.recalculate_bonus_points(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bonus_predictions bp
  set
    points = case
      when bq.correct_answer is not null
        and lower(trim(bp.answer)) = lower(trim(bq.correct_answer))
      then bq.points_value
      else 0
    end,
    updated_at = now()
  from public.bonus_questions bq
  where bp.question_id = p_question_id
    and bq.id = p_question_id;
end;
$$;

create or replace function public.save_bonus_prediction(
  p_group_id uuid,
  p_question_id uuid,
  p_answer text,
  p_as_admin boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
  v_points int := 0;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if length(trim(p_answer)) < 1 then
    raise exception 'Vastus ei tohi olla tühi';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'Sa pole selle grupi liige';
  end if;

  if p_as_admin and not public.is_group_admin(p_group_id) then
    raise exception 'Ainult admin saab teiste boonuseid muuta';
  end if;

  select bq.tournament_id into v_tournament_id
  from public.bonus_questions bq
  join public.prediction_groups pg on pg.tournament_id = bq.tournament_id
  where bq.id = p_question_id and pg.id = p_group_id;

  if not found then
    raise exception 'Küsimust ei leitud';
  end if;

  if not p_as_admin and public.is_bonus_locked(v_tournament_id) then
    raise exception 'Boonused on lukustatud — turniir on alanud';
  end if;

  select case
    when bq.correct_answer is not null
      and lower(trim(p_answer)) = lower(trim(bq.correct_answer))
    then bq.points_value
    else 0
  end into v_points
  from public.bonus_questions bq
  where bq.id = p_question_id;

  insert into public.bonus_predictions (
    group_id,
    user_id,
    question_id,
    answer,
    points,
    last_modified_by,
    modified_by_admin
  )
  values (
    p_group_id,
    v_user_id,
    p_question_id,
    trim(p_answer),
    v_points,
    v_user_id,
    p_as_admin
  )
  on conflict (group_id, user_id, question_id)
  do update set
    answer = excluded.answer,
    points = excluded.points,
    last_modified_by = excluded.last_modified_by,
    modified_by_admin = excluded.modified_by_admin,
    updated_at = now();
end;
$$;

create or replace function public.admin_save_member_bonus(
  p_group_id uuid,
  p_user_id uuid,
  p_question_id uuid,
  p_answer text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
  v_points int := 0;
  v_admin_id uuid := auth.uid();
begin
  if v_admin_id is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if not public.is_group_admin(p_group_id) then
    raise exception 'Ainult admin saab muuta';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  ) then
    raise exception 'Kasutaja pole grupi liige';
  end if;

  if length(trim(p_answer)) < 1 then
    raise exception 'Vastus ei tohi olla tühi';
  end if;

  select bq.tournament_id into v_tournament_id
  from public.bonus_questions bq
  join public.prediction_groups pg on pg.tournament_id = bq.tournament_id
  where bq.id = p_question_id and pg.id = p_group_id;

  if not found then
    raise exception 'Küsimust ei leitud';
  end if;

  select case
    when bq.correct_answer is not null
      and lower(trim(p_answer)) = lower(trim(bq.correct_answer))
    then bq.points_value
    else 0
  end into v_points
  from public.bonus_questions bq
  where bq.id = p_question_id;

  insert into public.bonus_predictions (
    group_id,
    user_id,
    question_id,
    answer,
    points,
    last_modified_by,
    modified_by_admin
  )
  values (
    p_group_id,
    p_user_id,
    p_question_id,
    trim(p_answer),
    v_points,
    v_admin_id,
    true
  )
  on conflict (group_id, user_id, question_id)
  do update set
    answer = excluded.answer,
    points = excluded.points,
    last_modified_by = excluded.last_modified_by,
    modified_by_admin = true,
    updated_at = now();
end;
$$;

create or replace function public.set_bonus_correct_answer(
  p_question_id uuid,
  p_correct_answer text
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
  from public.bonus_questions
  where id = p_question_id;

  if not found then
    raise exception 'Küsimust ei leitud';
  end if;

  if not exists (
    select 1
    from public.prediction_groups pg
    join public.group_members gm on gm.group_id = pg.id
    where pg.tournament_id = v_tournament_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  ) then
    raise exception 'Ainult admin saab õigeid vastuseid sisestada';
  end if;

  update public.bonus_questions
  set correct_answer = nullif(trim(p_correct_answer), '')
  where id = p_question_id;

  perform public.recalculate_bonus_points(p_question_id);
end;
$$;

alter table public.bonus_questions enable row level security;
alter table public.bonus_predictions enable row level security;

create policy "bonus_questions_select_member"
  on public.bonus_questions for select
  to authenticated
  using (
    exists (
      select 1
      from public.prediction_groups pg
      join public.group_members gm on gm.group_id = pg.id
      where pg.tournament_id = bonus_questions.tournament_id
        and gm.user_id = auth.uid()
    )
  );

create policy "bonus_questions_update_admin"
  on public.bonus_questions for update
  to authenticated
  using (
    exists (
      select 1
      from public.prediction_groups pg
      join public.group_members gm on gm.group_id = pg.id
      where pg.tournament_id = bonus_questions.tournament_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

create policy "bonus_predictions_select_own"
  on public.bonus_predictions for select
  to authenticated
  using (user_id = auth.uid());

create policy "bonus_predictions_select_after_lock"
  on public.bonus_predictions for select
  to authenticated
  using (
    public.is_group_member(group_id)
    and exists (
      select 1
      from public.bonus_questions bq
      join public.prediction_groups pg on pg.tournament_id = bq.tournament_id
      where bq.id = bonus_predictions.question_id
        and pg.id = bonus_predictions.group_id
        and public.is_bonus_locked(bq.tournament_id)
    )
  );

grant execute on function public.is_bonus_locked(uuid) to authenticated;
grant execute on function public.save_bonus_prediction(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.admin_save_member_bonus(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.set_bonus_correct_answer(uuid, text) to authenticated;

-- MM 2026 boonusküsimused (12 gruppi)
insert into public.bonus_questions (tournament_id, question_type, label, group_code, sort_order, points_value)
select
  t.id,
  v.question_type::public.bonus_question_type,
  v.label,
  v.group_code,
  v.sort_order,
  v.points_value
from public.tournaments t
cross join (
  values
    ('group_winner', 'Grupp A võitja', 'A', 1, 5),
    ('group_winner', 'Grupp B võitja', 'B', 2, 5),
    ('group_winner', 'Grupp C võitja', 'C', 3, 5),
    ('group_winner', 'Grupp D võitja', 'D', 4, 5),
    ('group_winner', 'Grupp E võitja', 'E', 5, 5),
    ('group_winner', 'Grupp F võitja', 'F', 6, 5),
    ('group_winner', 'Grupp G võitja', 'G', 7, 5),
    ('group_winner', 'Grupp H võitja', 'H', 8, 5),
    ('group_winner', 'Grupp I võitja', 'I', 9, 5),
    ('group_winner', 'Grupp J võitja', 'J', 10, 5),
    ('group_winner', 'Grupp K võitja', 'K', 11, 5),
    ('group_winner', 'Grupp L võitja', 'L', 12, 5),
    ('tournament_winner', 'Turniiri võitja (MM)', null, 20, 15),
    ('top_scorer', 'Enim väravaid lööja', null, 21, 10),
    ('semifinalist', 'Poolfinaalisti 1', null, 22, 8),
    ('semifinalist', 'Poolfinaalisti 2', null, 23, 8),
    ('semifinalist', 'Poolfinaalisti 3', null, 24, 8),
    ('semifinalist', 'Poolfinaalisti 4', null, 25, 8)
) as v(question_type, label, group_code, sort_order, points_value)
where t.slug = 'wc-2026'
  and not exists (
    select 1 from public.bonus_questions bq where bq.tournament_id = t.id
  );

-- EM 2028 (6 gruppi)
insert into public.bonus_questions (tournament_id, question_type, label, group_code, sort_order, points_value)
select
  t.id,
  v.question_type::public.bonus_question_type,
  v.label,
  v.group_code,
  v.sort_order,
  v.points_value
from public.tournaments t
cross join (
  values
    ('group_winner', 'Grupp A võitja', 'A', 1, 5),
    ('group_winner', 'Grupp B võitja', 'B', 2, 5),
    ('group_winner', 'Grupp C võitja', 'C', 3, 5),
    ('group_winner', 'Grupp D võitja', 'D', 4, 5),
    ('group_winner', 'Grupp E võitja', 'E', 5, 5),
    ('group_winner', 'Grupp F võitja', 'F', 6, 5),
    ('tournament_winner', 'Turniiri võitja (EM)', null, 20, 15),
    ('top_scorer', 'Enim väravaid lööja', null, 21, 10),
    ('semifinalist', 'Poolfinaalisti 1', null, 22, 8),
    ('semifinalist', 'Poolfinaalisti 2', null, 23, 8),
    ('semifinalist', 'Poolfinaalisti 3', null, 24, 8),
    ('semifinalist', 'Poolfinaalisti 4', null, 25, 8)
) as v(question_type, label, group_code, sort_order, points_value)
where t.slug = 'ec-2028'
  and not exists (
    select 1 from public.bonus_questions bq where bq.tournament_id = t.id
  );
