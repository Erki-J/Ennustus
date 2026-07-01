"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isAppLocale } from "@/lib/settings/locale";
import { fetchBonusTeamOptions } from "@/lib/bonus/team-options.server";
import type { BonusQuestion } from "@/lib/bonus/queries";
import {
  getActiveMatchdayRound,
  getGroupMatchdays,
  resolveMatchdayRound,
} from "@/lib/matchdays/queries";
import { getGroupContext } from "@/lib/groups/context";
import { parseCronSettings } from "@/lib/cron/settings";
import { getCronStatus } from "@/lib/cron/sync";

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
    `/groups/${groupId}/settings/general`,
    `/groups/${groupId}/settings/scoring`,
    `/groups/${groupId}/settings/cron`,
    `/groups/${groupId}/bonus-results`,
    `/groups/${groupId}/settings/predictions`,
    `/groups/${groupId}/matches`,
    `/groups/${groupId}`,
  ];
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function updateMyLocale(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const locale = String(formData.get("locale") ?? "").trim();

  if (!isAppLocale(locale)) {
    return { error: "Palun vali kehtiv keel." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_locale", {
    p_locale: locale,
  });

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: "Keel uuendatud." };
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
  const drawPoints = Number(formData.get("draw_points"));
  const bonusPoints = Number(formData.get("bonus_points"));

  if (
    !groupId ||
    [exactScore, goalDiff, tendency, drawPoints, bonusPoints].some((n) =>
      Number.isNaN(n),
    )
  ) {
    return { error: "Palun sisesta kehtivad punktid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_group_scoring", {
    p_group_id: groupId,
    p_exact_score: exactScore,
    p_goal_diff: goalDiff,
    p_tendency: tendency,
    p_draw_points: drawPoints,
    p_bonus_points: bonusPoints,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGroupModules(groupId);
  return { success: "Punktireeglid uuendatud." };
}

export async function getAdminPredictionMatrix(groupId: string, roundKey?: string) {
  const context = await getGroupContext(groupId);

  if (!context || context.myRole !== "admin") {
    return null;
  }

  const supabase = await createClient();
  const { rounds } = await getGroupMatchdays(groupId);
  const round =
    rounds.length === 0
      ? null
      : (resolveMatchdayRound(rounds, roundKey) ?? getActiveMatchdayRound(rounds));

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, nickname")
    .eq("group_id", groupId)
    .order("nickname");

  const matches = round?.matches ?? [];

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
    rounds,
    round,
    matches,
    predictionMap,
  };
}

export async function getAdminMemberBonus(groupId: string, userId: string) {
  const context = await getGroupContext(groupId);

  if (!context || context.myRole !== "admin") {
    return null;
  }

  const supabase = await createClient();

  const { data: group } = await supabase
    .from("prediction_groups")
    .select("tournament_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return null;
  }

  const teamOptions = await fetchBonusTeamOptions(group.tournament_id);

  const { data: questions } = await supabase
    .from("bonus_questions")
    .select(
      "id, tournament_id, question_type, label, group_code, sort_order, points_value, correct_answer",
    )
    .eq("tournament_id", group.tournament_id)
    .order("sort_order");

  const { data: predictions } = await supabase
    .from("bonus_predictions")
    .select("question_id, answer, points")
    .eq("group_id", groupId)
    .eq("user_id", userId);

  const predictionMap = new Map(
    (predictions ?? []).map((prediction) => [prediction.question_id, prediction]),
  );

  const items: BonusQuestion[] = (questions ?? []).map((question) => ({
    ...question,
    question_type: question.question_type as BonusQuestion["question_type"],
  }));

  return {
    context,
    teamOptions,
    bonusPoints: context.scoring.bonus_points,
    questions: items.map((question) => ({
      question,
      answer: predictionMap.get(question.id)?.answer ?? null,
      points: predictionMap.get(question.id)?.points ?? 0,
    })),
  };
}

export async function updateGroupCron(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const groupId = String(formData.get("group_id") ?? "");
  const enabled = formData.get("enabled") === "on";
  const intervalMinutes = Number(formData.get("interval_minutes"));
  const matchDurationMinutes = Number(formData.get("match_duration_minutes"));
  const windowEndOffsetMinutes = Number(formData.get("window_end_offset_minutes"));

  if (
    !groupId ||
    Number.isNaN(intervalMinutes) ||
    Number.isNaN(matchDurationMinutes) ||
    Number.isNaN(windowEndOffsetMinutes)
  ) {
    return { error: "Palun sisesta kehtivad väärtused." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_group_cron", {
    p_group_id: groupId,
    p_enabled: enabled,
    p_interval_minutes: intervalMinutes,
    p_match_duration_minutes: matchDurationMinutes,
    p_window_end_offset_minutes: windowEndOffsetMinutes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGroupModules(groupId);
  return { success: "Cron seaded uuendatud." };
}

export async function getGroupCronPageData(groupId: string) {
  const context = await getGroupContext(groupId);

  if (!context || context.myRole !== "admin") {
    return null;
  }

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("prediction_groups")
    .select("tournament_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return null;
  }

  const { data: settings } = await supabase
    .from("group_settings")
    .select("cron")
    .eq("group_id", groupId)
    .single();

  const cron = parseCronSettings(settings?.cron);
  const status = await getCronStatus(group.tournament_id, cron);

  return {
    context,
    cron,
    status,
  };
}
