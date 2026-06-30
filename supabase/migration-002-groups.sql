-- Käivita Supabase SQL Editoris PÄRAST schema.sql
-- Lisab: turniirid, ennustusgrupid, liikmed, kutsed

create type public.group_member_role as enum ('admin', 'member');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.tournaments (slug, name, sort_order)
values
  ('wc-2026', 'Jalgpalli MM 2026', 1),
  ('ec-2028', 'Jalgpalli EM 2028', 2);

create table public.prediction_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tournament_id uuid not null references public.tournaments (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.prediction_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_member_role not null default 'member',
  nickname text not null,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.prediction_groups (id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references public.profiles (id),
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  unique (group_id, email)
);

create index group_members_user_id_idx on public.group_members (user_id);
create index group_invitations_token_idx on public.group_invitations (token);
create index group_invitations_email_idx on public.group_invitations (lower(email));

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.get_invitation_by_token(p_token text)
returns table (
  id uuid,
  group_id uuid,
  group_name text,
  tournament_name text,
  email text,
  status public.invitation_status,
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
    gi.status,
    gi.expires_at
  from public.group_invitations gi
  join public.prediction_groups pg on pg.id = gi.group_id
  join public.tournaments t on t.id = pg.tournament_id
  where gi.token = p_token;
$$;

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

  select email into v_user_email from public.profiles where id = auth.uid();

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

alter table public.tournaments enable row level security;
alter table public.prediction_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;

create policy "tournaments_select_authenticated"
  on public.tournaments for select
  to authenticated
  using (is_active = true);

create policy "prediction_groups_select_member"
  on public.prediction_groups for select
  to authenticated
  using (public.is_group_member(id) or created_by = auth.uid());

create policy "prediction_groups_insert_authenticated"
  on public.prediction_groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "group_members_select_member"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_members_insert_creator"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      role = 'admin'
      and exists (
        select 1 from public.prediction_groups pg
        where pg.id = group_id and pg.created_by = auth.uid()
      )
    )
  );

create policy "group_invitations_select_admin"
  on public.group_invitations for select
  to authenticated
  using (public.is_group_admin(group_id));

create policy "group_invitations_insert_admin"
  on public.group_invitations for insert
  to authenticated
  with check (
    public.is_group_admin(group_id)
    and invited_by = auth.uid()
  );

grant execute on function public.get_invitation_by_token(text) to authenticated, anon;
grant execute on function public.accept_group_invitation(text, text) to authenticated;
