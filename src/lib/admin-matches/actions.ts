"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncKnockoutTeams } from "@/lib/cron/bracket/sync-teams";
import { syncManagedPlayerPredictionsForGroups } from "@/lib/groups/fill-managed-predictions";
import { getTranslations } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/types/database";

function matchesRoundPath(groupId: string, roundKey: string) {
  return `/groups/${groupId}/matches/${roundKey}`;
}

async function redirectToMatchesRound(
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

async function propagateKnockoutTeams(matchId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { data: matchRow } = await admin
    .from("matches")
    .select("tournament_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!matchRow?.tournament_id) {
    return;
  }

  const [{ data: tournament }, { data: matches }] = await Promise.all([
    admin.from("tournaments").select("slug").eq("id", matchRow.tournament_id).maybeSingle(),
    admin
      .from("matches")
      .select(
        "id, tournament_id, home_team, away_team, kickoff_at, stage, matchday, group_code, sort_order, home_score, away_score, status",
      )
      .eq("tournament_id", matchRow.tournament_id),
  ]);

  if (!tournament?.slug || !matches?.length) {
    return;
  }

  await syncKnockoutTeams(admin, tournament.slug, matches as Match[]);

  if (tournament.slug === "wc-2026") {
    const { data: groups } = await admin
      .from("prediction_groups")
      .select("id")
      .eq("tournament_id", matchRow.tournament_id);

    if (groups?.length) {
      await syncManagedPlayerPredictionsForGroups(
        admin,
        groups.map((group) => group.id),
        matchRow.tournament_id,
      );
    }
  }
}

export async function saveMatchResult(formData: FormData) {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "");
  const roundKey = String(formData.get("round_key") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const homeScore = Number(formData.get("home_score"));
  const awayScore = Number(formData.get("away_score"));

  if (!groupId || !roundKey || !matchId) {
    if (groupId && roundKey) {
      await redirectToMatchesRound(groupId, roundKey, {
        error: t("admin.errorResultRequired"),
      });
    }
    redirect("/dashboard");
  }

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    await redirectToMatchesRound(groupId, roundKey, {
      error: t("admin.errorInvalidScore"),
    });
  }

  if (homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    await redirectToMatchesRound(groupId, roundKey, {
      error: t("admin.errorScoreRange"),
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_match_result", {
    p_match_id: matchId,
    p_home_score: homeScore,
    p_away_score: awayScore,
  });

  if (error) {
    await redirectToMatchesRound(groupId, roundKey, { error: error.message });
  }

  await propagateKnockoutTeams(matchId);

  revalidateGroupModules(groupId, roundKey);
  await redirectToMatchesRound(groupId, roundKey, {
    success: t("admin.resultSaved"),
  });
}
