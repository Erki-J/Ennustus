import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export type PlatformUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  group_count: number;
  groups_created: number;
};

export type PlatformGroupRow = {
  id: string;
  name: string;
  created_at: string;
  tournament_name: string;
  creator_email: string;
  creator_name: string | null;
  member_count: number;
};

export type PlatformOverview = {
  userCount: number;
  groupCount: number;
  users: PlatformUserRow[];
  groups: PlatformGroupRow[];
};

export async function getPlatformOverview(): Promise<PlatformOverview | null> {
  const supabase = await createClient();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return null;
  }

  const { data: groups, error: groupsError } = await supabase
    .from("prediction_groups")
    .select(
      `
      id,
      name,
      created_at,
      created_by,
      tournament:tournaments ( name )
    `,
    )
    .order("created_at", { ascending: false });

  if (groupsError) {
    return null;
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("group_id, user_id");

  if (membershipsError) {
    return null;
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile as Profile]),
  );

  const memberCountByGroup = new Map<string, number>();
  const groupCountByUser = new Map<string, number>();
  const groupsCreatedByUser = new Map<string, number>();

  for (const membership of memberships ?? []) {
    memberCountByGroup.set(
      membership.group_id,
      (memberCountByGroup.get(membership.group_id) ?? 0) + 1,
    );
    groupCountByUser.set(
      membership.user_id,
      (groupCountByUser.get(membership.user_id) ?? 0) + 1,
    );
  }

  for (const group of groups ?? []) {
    groupsCreatedByUser.set(
      group.created_by,
      (groupsCreatedByUser.get(group.created_by) ?? 0) + 1,
    );
  }

  const users: PlatformUserRow[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    role: profile.role as UserRole,
    created_at: profile.created_at,
    group_count: groupCountByUser.get(profile.id) ?? 0,
    groups_created: groupsCreatedByUser.get(profile.id) ?? 0,
  }));

  const groupRows: PlatformGroupRow[] = (groups ?? []).map((group) => {
    const creator = profileById.get(group.created_by);
    const tournament = group.tournament as unknown as { name: string } | null;

    return {
      id: group.id,
      name: group.name,
      created_at: group.created_at,
      tournament_name: tournament?.name ?? "—",
      creator_email: creator?.email ?? "—",
      creator_name: creator?.display_name ?? null,
      member_count: memberCountByGroup.get(group.id) ?? 0,
    };
  });

  return {
    userCount: users.length,
    groupCount: groupRows.length,
    users,
    groups: groupRows,
  };
}
