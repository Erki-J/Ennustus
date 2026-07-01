"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "@/lib/i18n/server";
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
import { ADMIN_PREDICTIONS_BONUS_SECTION } from "@/lib/settings/predictions";

export type SettingsActionState = {
  error?: string;
  success?: string;
  saved?: {
    home_goals: number;
    away_goals: number;
  };
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
  const t = await getTranslations();
  const locale = String(formData.get("locale") ?? "").trim();

  if (!isAppLocale(locale)) {
    return { error: t("settings.errorInvalidLocale") };
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
  return { success: t("settings.languageUpdated") };
}

export async function adminSaveMemberPrediction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const homeGoals = Number(formData.get("home_goals"));
  const awayGoals = Number(formData.get("away_goals"));

  if (!groupId || !userId || !matchId || Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) {
    return { error: t("predictionCentre.errorScoreRequired") };
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
  return {
    success: t("settings.predictionUpdated"),
    saved: { home_goals: homeGoals, away_goals: awayGoals },
  };
}

export async function updateGroupScoring(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const t = await getTranslations();
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
    return { error: t("settings.errorInvalidPoints") };
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
  return { success: t("settings.scoringUpdated") };
}

export async function getAdminPredictionMatrix(groupId: string, roundKey?: string) {
  const context = await getGroupContext(groupId);

  if (!context || context.myRole !== "admin") {
    return null;
  }

  const supabase = await createClient();
  const locale = await getLocale();
  const { rounds } = await getGroupMatchdays(groupId, locale);
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

export type AdminBonusPanel = {
  bonusPredictions: Array<{
    question: BonusQuestion;
    answer: string | null;
    points: number;
  }>;
  bonusPoints: number;
  teamOptions: Awaited<ReturnType<typeof fetchBonusTeamOptions>>;
};

export async function getAdminBonusPanelsForGroup(
  groupId: string,
): Promise<AdminBonusPanel & { byUser: Record<string, AdminBonusPanel> } | null> {
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

  const locale = await getLocale();
  const teamOptions = await fetchBonusTeamOptions(group.tournament_id, locale);

  const { data: questions } = await supabase
    .from("bonus_questions")
    .select(
      "id, tournament_id, question_type, label, group_code, sort_order, points_value, correct_answer",
    )
    .eq("tournament_id", group.tournament_id)
    .order("sort_order");

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  const { data: predictions } = await supabase
    .from("bonus_predictions")
    .select("user_id, question_id, answer, points")
    .eq("group_id", groupId);

  const items: BonusQuestion[] = (questions ?? []).map((question) => ({
    ...question,
    question_type: question.question_type as BonusQuestion["question_type"],
  }));

  const predictionsByUser = new Map<
    string,
    Map<string, { answer: string | null; points: number }>
  >();

  for (const prediction of predictions ?? []) {
    if (!predictionsByUser.has(prediction.user_id)) {
      predictionsByUser.set(prediction.user_id, new Map());
    }
    predictionsByUser.get(prediction.user_id)!.set(prediction.question_id, {
      answer: prediction.answer,
      points: prediction.points,
    });
  }

  const emptyPanel: AdminBonusPanel = {
    bonusPredictions: items.map((question) => ({
      question,
      answer: null,
      points: 0,
    })),
    bonusPoints: context.scoring.bonus_points,
    teamOptions,
  };

  const byUser: Record<string, AdminBonusPanel> = {};

  for (const member of members ?? []) {
    const userPredictions = predictionsByUser.get(member.user_id);
    byUser[member.user_id] = {
      bonusPredictions: items.map((question) => ({
        question,
        answer: userPredictions?.get(question.id)?.answer ?? null,
        points: userPredictions?.get(question.id)?.points ?? 0,
      })),
      bonusPoints: context.scoring.bonus_points,
      teamOptions,
    };
  }

  return {
    ...emptyPanel,
    byUser,
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

  const locale = await getLocale();
  const teamOptions = await fetchBonusTeamOptions(group.tournament_id, locale);

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

export type AdminMemberPredictionsPanel = {
  selectedSection: string;
  matches: Array<{
    id: string;
    home_team: string;
    away_team: string;
    kickoff_at: string;
  }>;
  predictions: Array<{
    match_id: string;
    home_goals: number;
    away_goals: number;
  }>;
  bonusPredictions: Array<{
    question: BonusQuestion;
    answer: string | null;
    points: number;
  }>;
  bonusPoints: number;
  teamOptions: Awaited<ReturnType<typeof fetchBonusTeamOptions>>;
};

export async function loadAdminMemberBonusPanel(
  groupId: string,
  userId: string,
): Promise<Pick<
  AdminMemberPredictionsPanel,
  "bonusPredictions" | "bonusPoints" | "teamOptions"
> | null> {
  const bonusData = await getAdminMemberBonus(groupId, userId);
  if (!bonusData) {
    return null;
  }

  return {
    bonusPredictions: bonusData.questions,
    bonusPoints: bonusData.bonusPoints,
    teamOptions: bonusData.teamOptions,
  };
}

export async function loadAdminMemberPredictionsPanel(
  groupId: string,
  userId: string,
  section: string,
): Promise<AdminMemberPredictionsPanel | null> {
  const isBonusSection = section === ADMIN_PREDICTIONS_BONUS_SECTION;
  const matrix = await getAdminPredictionMatrix(
    groupId,
    isBonusSection ? undefined : section,
  );

  if (!matrix) {
    return null;
  }

  const { matches, predictionMap, context, round, rounds } = matrix;
  const selectedSection = isBonusSection
    ? ADMIN_PREDICTIONS_BONUS_SECTION
    : (round?.key ?? rounds[0]?.key ?? ADMIN_PREDICTIONS_BONUS_SECTION);

  const predictions = matches.map((match) => {
    const prediction = predictionMap.get(`${userId}:${match.id}`);
    return {
      match_id: match.id,
      home_goals: prediction?.home_goals ?? 0,
      away_goals: prediction?.away_goals ?? 0,
    };
  });

  let bonusPredictions: AdminMemberPredictionsPanel["bonusPredictions"] = [];
  let bonusPoints = context.scoring.bonus_points;
  let teamOptions: AdminMemberPredictionsPanel["teamOptions"] = {
    allTeams: [],
    teamsByGroup: {},
  };

  if (isBonusSection) {
    const bonusData = await getAdminMemberBonus(groupId, userId);
    if (bonusData) {
      bonusPredictions = bonusData.questions;
      bonusPoints = bonusData.bonusPoints;
      teamOptions = bonusData.teamOptions;
    }
  }

  return {
    selectedSection,
    matches: matches.map((match) => ({
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
      kickoff_at: match.kickoff_at,
    })),
    predictions,
    bonusPredictions,
    bonusPoints,
    teamOptions,
  };
}

export async function updateGroupCron(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const t = await getTranslations();
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
    return { error: t("settings.errorInvalidCron") };
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
  return { success: t("settings.cronUpdated") };
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
