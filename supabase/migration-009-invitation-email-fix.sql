-- Käivita Supabase SQL Editoris PÄRAST migration-008-revoke-invitations.sql
-- Kutse e-mail võrreldakse auth.users e-mailiga; kasutaja näeb ootel kutseid

create or replace function public.accept_group_invitation(p_token text, p_nickname text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.group_invitations%rowtype;
  v_user_email text;
  v_member_id uuid;
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

  insert into public.group_members (group_id, user_id, role, nickname)
  values (v_invite.group_id, auth.uid(), 'member', trim(p_nickname))
  returning id into v_member_id;

  update public.group_invitations
  set status = 'accepted'
  where id = v_invite.id;

  return v_invite.group_id;
end;
$$;

create or replace function public.get_my_pending_invitations()
returns table (
  id uuid,
  group_id uuid,
  group_name text,
  tournament_name text,
  email text,
  token text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    gi.id,
    gi.group_id,
    pg.name as group_name,
    t.name as tournament_name,
    gi.email,
    gi.token,
    gi.expires_at
  from public.group_invitations gi
  join public.prediction_groups pg on pg.id = gi.group_id
  join public.tournaments t on t.id = pg.tournament_id
  where gi.status = 'pending'
    and gi.expires_at >= now()
    and auth.uid() is not null
    and lower(gi.email) = lower((
      select u.email from auth.users u where u.id = auth.uid()
    ))
  order by gi.created_at desc;
$$;

grant execute on function public.get_my_pending_invitations() to authenticated;

create policy "group_invitations_update_admin"
  on public.group_invitations for update
  to authenticated
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));
