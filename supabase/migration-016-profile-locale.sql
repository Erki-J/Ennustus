-- Käivita Supabase SQL Editoris
-- Kasutaja keele eelistus profiilis

alter table public.profiles
  add column if not exists locale text not null default 'et'
  check (locale in ('et', 'en'));

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

  if p_locale not in ('et', 'en') then
    raise exception 'Keel peab olema et või en';
  end if;

  update public.profiles
  set locale = p_locale
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_locale(text) to authenticated;
