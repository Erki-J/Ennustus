-- Käivita Supabase SQL Editoris PÄRAST migration-002-groups.sql
-- Admin saab ootel kutse tühistada (status -> revoked)

create or replace function public.revoke_group_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Pead olema sisse logitud';
  end if;

  select group_id into v_group_id
  from public.group_invitations
  where id = p_invitation_id
    and status = 'pending';

  if not found then
    raise exception 'Kutset ei leitud või see pole enam tühistatav';
  end if;

  if not public.is_group_admin(v_group_id) then
    raise exception 'Ainult admin saab kutse tühistada';
  end if;

  update public.group_invitations
  set status = 'revoked'
  where id = p_invitation_id;
end;
$$;

grant execute on function public.revoke_group_invitation(uuid) to authenticated;
