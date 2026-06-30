-- Käivita Supabase SQL Editoris PÄRAST migration-004-bonus.sql
-- Grupi punktireeglitesse lisatud boonuse punktid (vaikimisi 4)

update public.group_settings
set scoring = scoring || '{"bonus_points": 4}'::jsonb
where not (scoring ? 'bonus_points');

alter table public.group_settings
  alter column scoring set default '{"exact_score": 4, "goal_diff": 3, "tendency": 2, "bonus_points": 4}'::jsonb;

create or replace function public.group_bonus_points(p_group_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((gs.scoring ->> 'bonus_points')::int, 4)
  from public.group_settings gs
  where gs.group_id = p_group_id;
$$;

create or replace function public.recalculate_group_bonus_points(p_group_id uuid)
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
      then public.group_bonus_points(bp.group_id)
      else 0
    end,
    updated_at = now()
  from public.bonus_questions bq
  where bp.group_id = p_group_id
    and bq.id = bp.question_id;
end;
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
      then public.group_bonus_points(bp.group_id)
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
    then public.group_bonus_points(p_group_id)
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
    then public.group_bonus_points(p_group_id)
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

grant execute on function public.group_bonus_points(uuid) to authenticated;
grant execute on function public.recalculate_group_bonus_points(uuid) to authenticated;
