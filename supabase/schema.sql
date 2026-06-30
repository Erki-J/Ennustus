-- Käivita Supabase SQL Editoris (Dashboard → SQL → New query)

create type public.user_role as enum ('user', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('scoring', '{"exact_score": 4, "goal_diff": 3, "tendency": 2}'::jsonb);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_update_own_display_name"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin());

create policy "app_settings_select_authenticated"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "app_settings_update_admin"
  on public.app_settings for update
  to authenticated
  using (public.is_admin());

-- Esimene admin (pärast registreerumist asenda e-mail):
-- update public.profiles set role = 'admin' where email = 'sinu@email.ee';
