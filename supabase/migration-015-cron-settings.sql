-- Käivita Supabase SQL Editoris PÄRAST migration-014-draw-scoring-logic-fix.sql
-- Automaatne tulemuste pärimine: grupi cron seaded

alter table public.group_settings
  add column if not exists cron jsonb not null default '{
    "enabled": false,
    "interval_minutes": 5,
    "window_start": "kickoff",
    "match_duration_minutes": 105,
    "window_end_offset_minutes": 60,
    "last_run_at": null
  }'::jsonb;

create or replace function public.update_group_cron(
  p_group_id uuid,
  p_enabled boolean,
  p_interval_minutes int,
  p_match_duration_minutes int,
  p_window_end_offset_minutes int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing jsonb;
begin
  if auth.uid() is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  if not public.is_group_admin(p_group_id) then
    raise exception 'Ainult admin saab cron seadeid muuta';
  end if;

  if p_interval_minutes < 1 or p_interval_minutes > 120 then
    raise exception 'Intervall peab olema 1–120 minutit';
  end if;

  if p_match_duration_minutes < 60 or p_match_duration_minutes > 150 then
    raise exception 'Mängu kestus peab olema 60–150 minutit';
  end if;

  if p_window_end_offset_minutes < 0 or p_window_end_offset_minutes > 240 then
    raise exception 'Lõpu nihe peab olema 0–240 minutit';
  end if;

  select gs.cron into v_existing
  from public.group_settings gs
  where gs.group_id = p_group_id;

  update public.group_settings
  set
    cron = jsonb_build_object(
      'enabled', p_enabled,
      'interval_minutes', p_interval_minutes,
      'window_start', 'kickoff',
      'match_duration_minutes', p_match_duration_minutes,
      'window_end_offset_minutes', p_window_end_offset_minutes,
      'last_run_at', v_existing -> 'last_run_at'
    ),
    updated_at = now()
  where group_id = p_group_id;
end;
$$;

create or replace function public.touch_group_cron_run(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.group_settings
  set
    cron = jsonb_set(
      cron,
      '{last_run_at}',
      to_jsonb(now()::text),
      true
    ),
    updated_at = now()
  where group_id = p_group_id;
end;
$$;

grant execute on function public.update_group_cron(uuid, boolean, int, int, int) to authenticated;
grant execute on function public.touch_group_cron_run(uuid) to service_role;
