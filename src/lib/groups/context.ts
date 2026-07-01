import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ScoringSettings } from "@/types/database";

async function getGroupContextImpl(groupId: string) {
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
      tournament:tournaments ( name, slug )
    `,
    )
    .eq("id", groupId)
    .single();

  if (!group) {
    return null;
  }

  const { data: settings } = await supabase
    .from("group_settings")
    .select("scoring")
    .eq("group_id", groupId)
    .single();

  const tournament = group.tournament as unknown as { name: string; slug: string };

  const raw = settings?.scoring as Partial<ScoringSettings> | undefined;

  return {
    groupId: group.id,
    groupName: group.name,
    tournament,
    myRole: membership.role as "admin" | "member",
    myNickname: membership.nickname,
    userId: user.id,
    scoring: {
      exact_score: raw?.exact_score ?? 4,
      goal_diff: raw?.goal_diff ?? 3,
      tendency: raw?.tendency ?? 2,
      draw_points: raw?.draw_points ?? 2,
      bonus_points: raw?.bonus_points ?? 4,
    },
  };
}

export const getGroupContext = cache(getGroupContextImpl);
