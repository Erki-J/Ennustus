"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export type PredictionCentreActionState = {
  error?: string;
  success?: string;
};

function revalidateGroupModules(groupId: string) {
  revalidatePath(`/groups/${groupId}/overview`);
  revalidatePath(`/groups/${groupId}/prediction-centre`);
  revalidatePath(`/groups/${groupId}/overview`);
  revalidatePath(`/groups/${groupId}/overview/bonus`);
  revalidatePath(`/groups/${groupId}/general-overview`);
  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath(`/groups/${groupId}`);
}

export async function saveMyPrediction(
  _prevState: PredictionCentreActionState,
  formData: FormData,
): Promise<PredictionCentreActionState> {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const homeGoals = Number(formData.get("home_goals"));
  const awayGoals = Number(formData.get("away_goals"));

  if (!groupId || !matchId || Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) {
    return { error: t("predictionCentre.errorScoreRequired") };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_match_prediction", {
    p_group_id: groupId,
    p_match_id: matchId,
    p_home_goals: homeGoals,
    p_away_goals: awayGoals,
    p_as_admin: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGroupModules(groupId);
  return { success: t("predictionCentre.predictionSaved") };
}
