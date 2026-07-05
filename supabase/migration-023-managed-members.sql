-- Käivita Supabase SQL Editoris PÄRAST migration-022-platform-admin-policies.sql
-- Admini hallatavad mängijad ilma e-mailita (süsteemne konto, ennustusi sisestab admin).

alter table public.group_members
  add column if not exists is_managed boolean not null default false;

create index if not exists group_members_managed_idx
  on public.group_members (group_id, is_managed);

create or replace function public.remove_group_member(
  p_group_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.group_members%rowtype;
  v_email text;
  v_history_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if not public.is_group_admin(p_group_id) then
    raise exception 'Ainult admin saab mängijaid eemaldada';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Sa ei saa iseennast eemaldada';
  end if;

  select * into v_target
  from public.group_members
  where group_id = p_group_id and user_id = p_user_id;

  if not found then
    raise exception 'Mängijat ei leitud';
  end if;

  if v_target.role = 'admin' then
    raise exception 'Admini ei saa eemaldada';
  end if;

  if v_target.is_managed then
    delete from public.match_predictions
    where group_id = p_group_id and user_id = p_user_id;

    delete from public.bonus_predictions
    where group_id = p_group_id and user_id = p_user_id;

    delete from public.group_members
    where group_id = p_group_id and user_id = p_user_id;

    return;
  end if;

  select lower(trim(p.email)) into v_email
  from public.profiles p
  where p.id = p_user_id;

  if v_email is null or v_email = '' then
    raise exception 'Mängija e-mail puudub';
  end if;

  delete from public.group_member_history
  where group_id = p_group_id and lower(email) = v_email;

  insert into public.group_member_history (group_id, email, nickname, removed_by)
  values (p_group_id, v_email, v_target.nickname, auth.uid())
  returning id into v_history_id;

  insert into public.group_member_history_match_predictions (
    history_id,
    match_id,
    home_goals,
    away_goals,
    points,
    modified_by_admin
  )
  select
    v_history_id,
    mp.match_id,
    mp.home_goals,
    mp.away_goals,
    mp.points,
    mp.modified_by_admin
  from public.match_predictions mp
  where mp.group_id = p_group_id and mp.user_id = p_user_id;

  insert into public.group_member_history_bonus_predictions (
    history_id,
    question_id,
    answer,
    points
  )
  select
    v_history_id,
    bp.question_id,
    bp.answer,
    bp.points
  from public.bonus_predictions bp
  where bp.group_id = p_group_id and bp.user_id = p_user_id;

  delete from public.match_predictions
  where group_id = p_group_id and user_id = p_user_id;

  delete from public.bonus_predictions
  where group_id = p_group_id and user_id = p_user_id;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;
