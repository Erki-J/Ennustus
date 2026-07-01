-- Käivita Supabase SQL Editoris
-- Lisab keelevaliku: eesti UI + inglise riigid (et-en)

alter table public.profiles
  drop constraint if exists profiles_locale_check;

alter table public.profiles
  add constraint profiles_locale_check
  check (locale in ('et', 'en', 'et-en'));

create or replace function public.update_my_locale(p_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if p_locale not in ('et', 'en', 'et-en') then
    raise exception 'Keel peab olema et, en või et-en';
  end if;

  update public.profiles
  set locale = p_locale
  where id = auth.uid();
end;
$$;
