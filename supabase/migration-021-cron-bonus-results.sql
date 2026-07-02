-- Käivita Supabase SQL Editoris PÄRAST migration-020-update-group-name.sql
-- Cron boonusvastuste automaatne täitmine (service_role)

create or replace function public.cron_set_bonus_correct_answer(
  p_question_id uuid,
  p_correct_answer text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trimmed text := nullif(trim(p_correct_answer), '');
begin
  if v_trimmed is null then
    return false;
  end if;

  update public.bonus_questions
  set correct_answer = v_trimmed
  where id = p_question_id
    and correct_answer is null;

  if not found then
    return false;
  end if;

  perform public.recalculate_bonus_points(p_question_id);
  return true;
end;
$$;

revoke all on function public.cron_set_bonus_correct_answer(uuid, text) from public;
grant execute on function public.cron_set_bonus_correct_answer(uuid, text) to service_role;
