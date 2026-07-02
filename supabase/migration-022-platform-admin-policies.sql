-- Käivita Supabase SQL Editoris PÄRAST migration-021-cron-bonus-results.sql
-- Platvormi admin (profiles.role = admin) näeb kõiki gruppe ja liikmeid

create policy "prediction_groups_select_platform_admin"
  on public.prediction_groups for select
  to authenticated
  using (public.is_admin());

create policy "group_members_select_platform_admin"
  on public.group_members for select
  to authenticated
  using (public.is_admin());
