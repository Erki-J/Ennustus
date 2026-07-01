"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function matchesRoundPath(groupId: string, roundKey: string) {
  return `/groups/${groupId}/matches/${roundKey}`;
}

function redirectToMatchesRound(
  groupId: string,
  roundKey: string,
  params: { error?: string; success?: string },
) {
  const search = new URLSearchParams();
  if (params.error) {
    search.set("error", params.error);
  }
  if (params.success) {
    search.set("success", params.success);
  }
  const query = search.toString();
  redirect(query ? `${matchesRoundPath(groupId, roundKey)}?${query}` : matchesRoundPath(groupId, roundKey));
}

function revalidateGroupModules(groupId: string, roundKey: string) {
  revalidatePath(`/groups/${groupId}/overview`);
  revalidatePath(`/groups/${groupId}/prediction-centre`);
  revalidatePath(`/groups/${groupId}/overview/bonus`);
  revalidatePath(`/groups/${groupId}/general-overview`);
  revalidatePath(`/groups/${groupId}/matches`);
  revalidatePath(matchesRoundPath(groupId, roundKey));
  revalidatePath(`/groups/${groupId}`);
}

export async function saveMatchResult(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const roundKey = String(formData.get("round_key") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const homeScore = Number(formData.get("home_score"));
  const awayScore = Number(formData.get("away_score"));

  if (!groupId || !roundKey || !matchId) {
    if (groupId && roundKey) {
      redirectToMatchesRound(groupId, roundKey, {
        error: "Palun sisesta tulemus.",
      });
    }
    redirect("/dashboard");
  }

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    redirectToMatchesRound(groupId, roundKey, {
      error: "Palun sisesta kehtiv skoor.",
    });
  }

  if (homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    redirectToMatchesRound(groupId, roundKey, {
      error: "Skoor peab olema vahemikus 0–20.",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_match_result", {
    p_match_id: matchId,
    p_home_score: homeScore,
    p_away_score: awayScore,
  });

  if (error) {
    redirectToMatchesRound(groupId, roundKey, { error: error.message });
  }

  revalidateGroupModules(groupId, roundKey);
  redirectToMatchesRound(groupId, roundKey, {
    success: "Mängu tulemus salvestatud, punktid arvutatud.",
  });
}
