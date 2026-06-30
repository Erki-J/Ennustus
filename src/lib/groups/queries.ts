import { createClient } from "@/lib/supabase/server";
import type { GroupWithMeta, InvitationPreview, Tournament } from "@/types/database";

export async function getActiveTournaments(): Promise<Tournament[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("id, slug, name, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");

  return data ?? [];
}

export async function getMyGroups(): Promise<GroupWithMeta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: memberships } = await supabase
    .from("group_members")
    .select(
      `
      role,
      nickname,
      group:prediction_groups (
        id,
        name,
        tournament_id,
        created_by,
        created_at,
        tournament:tournaments ( name, slug )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (!memberships) {
    return [];
  }

  const groups: GroupWithMeta[] = [];

  for (const membership of memberships) {
    const group = membership.group as unknown as {
      id: string;
      name: string;
      tournament_id: string;
      created_by: string;
      created_at: string;
      tournament: { name: string; slug: string };
    } | null;

    if (!group) {
      continue;
    }

    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", group.id);

    groups.push({
      id: group.id,
      name: group.name,
      tournament_id: group.tournament_id,
      created_by: group.created_by,
      created_at: group.created_at,
      tournament: group.tournament,
      my_role: membership.role as GroupWithMeta["my_role"],
      my_nickname: membership.nickname,
      member_count: count ?? 0,
    });
  }

  return groups;
}

export async function getGroupById(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("role, nickname")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  const { data: group } = await supabase
    .from("prediction_groups")
    .select(
      `
      id,
      name,
      tournament_id,
      created_by,
      created_at,
      tournament:tournaments ( name, slug )
    `,
    )
    .eq("id", groupId)
    .single();

  if (!group) {
    return null;
  }

  const tournament = group.tournament as unknown as { name: string; slug: string };

  const { data: members } = await supabase
    .from("group_members")
    .select("id, nickname, role, joined_at, user_id")
    .eq("group_id", groupId)
    .order("joined_at");

  const { data: invitations } =
    membership.role === "admin"
      ? await supabase
          .from("group_invitations")
          .select("id, email, token, status, expires_at, created_at")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
      : { data: [] };

  return {
    id: group.id,
    name: group.name,
    tournament,
    myRole: membership.role as "admin" | "member",
    myNickname: membership.nickname,
    members: members ?? [],
    invitations: invitations ?? [],
  };
}

export async function getInvitationByToken(
  token: string,
): Promise<InvitationPreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as InvitationPreview;
}
