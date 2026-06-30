"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPredictionCentreMatches } from "@/lib/prediction-centre/queries";
import { getGroupContext } from "@/lib/groups/context";
import type { ScoringSettings } from "@/types/database";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

function revalidateGroupModules(groupId: string) {
  const paths = [
    `/groups/${groupId}/overview`,
    `/groups/${groupId}/overview/bonus`,
    `/groups/${groupId}/prediction-centre`,
    `/groups/${groupId}/general-overview`,
    `/groups/${groupId}/settings`,
    `/groups/${groupId}/settings/scoring`,
    `/groups/${groupId}/settings/bonus`,
    `/groups/${groupId}/settings/predictions`,
    `/groups/${groupId}/settings/matches`,
    `/groups/${groupId}`,
  ];
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function adminSaveMemberPrediction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const groupId = String(formData.get("group_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const homeGoals = Number(formData.get("home_goals"));
  const awayGoals = Number(formData.get("away_goals"));

  if (!groupId || !userId || !matchId || Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) {
    return { error: "Palun sisesta skoor." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_member_prediction", {
    p_group_id: groupId,
    p_user_id: userId,
    p_match_id: matchId,
    p_home_goals: homeGoals,
    p_away_goals: awayGoals,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGroupModules(groupId);
  return { success: "Ennustus uuendatud." };
}

export async function updateGroupScoring(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const groupId = String(formData.get("group_id") ?? "");
  const exactScore = Number(formData.get("exact_score"));
  const goalDiff = Number(formData.get("goal_diff"));
  const tendency = Number(formData.get("tendency"));
  const bonusPoints = Number(formData.get("bonus_points"));

  if (
    !groupId ||
    [exactScore, goalDiff, tendency, bonusPoints].some((n) => Number.isNaN(n))
  ) {
    return { error: "Palun sisesta kehtivad punktid." };
  }

  const scoring: ScoringSettings = {
    exact_score: exactScore,
    goal_diff: goalDiff,
    tendency: tendency,
    bonus_points: bonusPoints,
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_settings")
    .update({ scoring, updated_at: new Date().toISOString() })
    .eq("group_id", groupId);

  if (error) {
    return { error: error.message };
  }

  const { error: recalcError } = await supabase.rpc("recalculate_group_bonus_points", {
    p_group_id: groupId,
  });

  if (recalcError) {
    return { error: recalcError.message };
  }

  revalidateGroupModules(groupId);
  return { success: "Punktireeglid uuendatud." };
}

export async function getAdminPredictionMatrix(groupId: string) {
  const context = await getGroupContext(groupId);

  if (!context || context.myRole !== "admin") {
    return null;
  }

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, nickname")
    .eq("group_id", groupId)
    .order("nickname");

  const matches = await getPredictionCentreMatches(groupId);

  const { data: predictions } = await supabase
    .from("match_predictions")
    .select("user_id, match_id, home_goals, away_goals, points")
    .eq("group_id", groupId);

  const predictionMap = new Map<
    string,
    { home_goals: number; away_goals: number; points: number }
  >();
  for (const prediction of predictions ?? []) {
    predictionMap.set(`${prediction.user_id}:${prediction.match_id}`, prediction);
  }

  return {
    context,
    members: members ?? [],
    matches,
    predictionMap,
  };
}
