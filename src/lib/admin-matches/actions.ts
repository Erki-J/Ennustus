"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MatchWithPrediction } from "@/lib/prediction-centre/queries";

export type AdminMatchesActionState = {
  error?: string;
  success?: string;
};

function revalidateGroupModules(groupId: string) {
  revalidatePath(`/groups/${groupId}/overview`);
  revalidatePath(`/groups/${groupId}/prediction-centre`);
  revalidatePath(`/groups/${groupId}/overview`);
  revalidatePath(`/groups/${groupId}/overview/bonus`);
  revalidatePath(`/groups/${groupId}/general-overview`);
  revalidatePath(`/groups/${groupId}/settings/matches`);
  revalidatePath(`/groups/${groupId}`);
}

export async function setMatchResult(
  _prevState: AdminMatchesActionState,
  formData: FormData,
): Promise<AdminMatchesActionState> {
  const groupId = String(formData.get("group_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const homeScore = Number(formData.get("home_score"));
  const awayScore = Number(formData.get("away_score"));

  if (!groupId || !matchId || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return { error: "Palun sisesta tulemus." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_match_result", {
    p_match_id: matchId,
    p_home_score: homeScore,
    p_away_score: awayScore,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGroupModules(groupId);
  return { success: "Mängu tulemus salvestatud, punktid arvutatud." };
}

export type { MatchWithPrediction };
