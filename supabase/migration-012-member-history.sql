-- Käivita Supabase SQL Editoris PÄRAST migration-011-draw-scoring.sql
-- Mängija eemaldamine ajalooga; uuesti liitumisel taastamine või tühj alustamine

create table public.group_member_history (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.prediction_groups (id) on delete cascade,
  email text not null,
  nickname text not null,
  removed_at timestamptz not null default now(),
  removed_by uuid references public.profiles (id) on delete set null,
  constraint group_member_history_group_email_key unique (group_id, email)
);

create index group_member_history_email_idx
  on public.group_member_history (group_id, lower(email));

create table public.group_member_history_match_predictions (
  history_id uuid not null references public.group_member_history (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  home_goals int not null check (home_goals >= 0),
  away_goals int not null check (away_goals >= 0),
  points int not null default 0,
  modified_by_admin boolean not null default false,
  primary key (history_id, match_id)
);

create table public.group_member_history_bonus_predictions (
  history_id uuid not null references public.group_member_history (id) on delete cascade,
  question_id uuid not null references public.bonus_questions (id) on delete cascade,
  answer text not null,
  points int not null default 0,
  primary key (history_id, question_id)
);

alter table public.group_member_history enable row level security;
alter table public.group_member_history_match_predictions enable row level security;
alter table public.group_member_history_bonus_predictions enable row level security;

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

create or replace function public.get_invitation_history_offer(p_token text)
returns table (
  has_history boolean,
  history_nickname text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_invite public.group_invitations%rowtype;
  v_user_email text;
  v_nickname text;
begin
  if auth.uid() is null then
    return query select false, null::text;
    return;
  end if;

  select email into v_user_email
  from auth.users
  where id = auth.uid();

  select * into v_invite
  from public.group_invitations
  where token = p_token;

  if not found then
    return query select false, null::text;
    return;
  end if;

  select h.nickname into v_nickname
  from public.group_member_history h
  where h.group_id = v_invite.group_id
    and lower(h.email) = lower(v_user_email);

  if v_nickname is null then
    return query select false, null::text;
  else
    return query select true, v_nickname;
  end if;
end;
$$;

create or replace function public.accept_group_invitation(
  p_token text,
  p_nickname text,
  p_restore_history boolean default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.group_invitations%rowtype;
  v_user_email text;
  v_history public.group_member_history%rowtype;
  v_nickname text;
  v_has_history boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if length(trim(p_nickname)) < 2 then
    raise exception 'Hüüdnimi peab olema vähemalt 2 tähemärki';
  end if;

  select email into v_user_email
  from auth.users
  where id = auth.uid();

  select * into v_invite
  from public.group_invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'Kutse ei leitud';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Kutse pole enam kehtiv';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Kutse on aegunud';
  end if;

  if lower(v_invite.email) <> lower(v_user_email) then
    raise exception 'Kutse on saadetud teisele e-mailile (%). Logi sisse õige kontoga.', v_invite.email;
  end if;

  if exists (
    select 1 from public.group_members
    where group_id = v_invite.group_id and user_id = auth.uid()
  ) then
    update public.group_invitations
    set status = 'accepted'
    where id = v_invite.id;

    return v_invite.group_id;
  end if;

  select * into v_history
  from public.group_member_history h
  where h.group_id = v_invite.group_id
    and lower(h.email) = lower(v_user_email);

  v_has_history := found;

  if v_has_history and p_restore_history is null then
    raise exception 'Palun vali, kas taastad varasema ajaloo või alustad nullist';
  end if;

  if v_has_history and p_restore_history then
    v_nickname := v_history.nickname;
  else
    v_nickname := trim(p_nickname);
  end if;

  insert into public.group_members (group_id, user_id, role, nickname)
  values (v_invite.group_id, auth.uid(), 'member', v_nickname);

  if v_has_history and p_restore_history then
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
    select
      v_invite.group_id,
      auth.uid(),
      hmp.match_id,
      hmp.home_goals,
      hmp.away_goals,
      hmp.points,
      auth.uid(),
      hmp.modified_by_admin
    from public.group_member_history_match_predictions hmp
    where hmp.history_id = v_history.id
    on conflict (group_id, user_id, match_id)
    do update set
      home_goals = excluded.home_goals,
      away_goals = excluded.away_goals,
      points = excluded.points,
      modified_by_admin = excluded.modified_by_admin,
      last_modified_by = excluded.last_modified_by,
      updated_at = now();

    insert into public.bonus_predictions (
      group_id,
      user_id,
      question_id,
      answer,
      points,
      last_modified_by
    )
    select
      v_invite.group_id,
      auth.uid(),
      hbp.question_id,
      hbp.answer,
      hbp.points,
      auth.uid()
    from public.group_member_history_bonus_predictions hbp
    where hbp.history_id = v_history.id
    on conflict (group_id, user_id, question_id)
    do update set
      answer = excluded.answer,
      points = excluded.points,
      last_modified_by = excluded.last_modified_by,
      updated_at = now();

    delete from public.group_member_history
    where id = v_history.id;
  elsif v_has_history and not p_restore_history then
    delete from public.group_member_history
    where id = v_history.id;
  end if;

  update public.group_invitations
  set status = 'accepted'
  where id = v_invite.id;

  return v_invite.group_id;
end;
$$;

grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
grant execute on function public.get_invitation_history_offer(text) to authenticated;
