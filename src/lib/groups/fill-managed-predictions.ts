import {
  composerBonusAnswer,
  composerMatchPrediction,
  isPredictableTeamName,
} from "@/lib/predictions/composer-picks";
import { createClient } from "@/lib/supabase/server";

export type FillManagedPredictionsResult = {
  matchesFilled: number;
  bonusFilled: number;
  skipped: number;
  errors: string[];
};

export async function fillManagedMemberPredictions(
  groupId: string,
  targetUserId: string,
): Promise<FillManagedPredictionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      matchesFilled: 0,
      bonusFilled: 0,
      skipped: 0,
      errors: ["Pead olema sisse logitud"],
    };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "admin") {
    return {
      matchesFilled: 0,
      bonusFilled: 0,
      skipped: 0,
      errors: ["Ainult admin"],
    };
  }

  const { data: targetMember } = await supabase
    .from("group_members")
    .select("nickname")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetMember) {
    return {
      matchesFilled: 0,
      bonusFilled: 0,
      skipped: 0,
      errors: ["Mängijat ei leitud"],
    };
  }

  const { data: group } = await supabase
    .from("prediction_groups")
    .select("tournament_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return {
      matchesFilled: 0,
      bonusFilled: 0,
      skipped: 0,
      errors: ["Gruppi ei leitud"],
    };
  }

  const nowIso = new Date().toISOString();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at")
    .eq("tournament_id", group.tournament_id)
    .gt("kickoff_at", nowIso)
    .order("kickoff_at");

  const { data: existingPredictions } = await supabase
    .from("match_predictions")
    .select("match_id")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  const existingMatchIds = new Set(
    (existingPredictions ?? []).map((row) => row.match_id),
  );

  let matchesFilled = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const match of matches ?? []) {
    if (existingMatchIds.has(match.id)) {
      skipped += 1;
      continue;
    }

    if (
      !isPredictableTeamName(match.home_team) ||
      !isPredictableTeamName(match.away_team)
    ) {
      skipped += 1;
      continue;
    }

    const [homeGoals, awayGoals] = composerMatchPrediction(
      match.home_team,
      match.away_team,
    );

    const { error } = await supabase.rpc("admin_save_member_prediction", {
      p_group_id: groupId,
      p_user_id: targetUserId,
      p_match_id: match.id,
      p_home_goals: homeGoals,
      p_away_goals: awayGoals,
    });

    if (error) {
      errors.push(`${match.home_team}–${match.away_team}: ${error.message}`);
      continue;
    }

    matchesFilled += 1;
  }

  const { data: bonusQuestions } = await supabase
    .from("bonus_questions")
    .select("id, question_type, group_code, sort_order")
    .eq("tournament_id", group.tournament_id)
    .order("sort_order");

  const { data: existingBonus } = await supabase
    .from("bonus_predictions")
    .select("question_id")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  const existingBonusIds = new Set(
    (existingBonus ?? []).map((row) => row.question_id),
  );

  let bonusFilled = 0;
  let semifinalIndex = 0;

  for (const question of bonusQuestions ?? []) {
    if (existingBonusIds.has(question.id)) {
      continue;
    }

    if (question.question_type === "semifinalist") {
      semifinalIndex += 1;
    }

    const answer = composerBonusAnswer(
      question.question_type,
      question.group_code,
      semifinalIndex,
    );

    if (!answer) {
      continue;
    }

    const { error } = await supabase.rpc("admin_save_member_bonus", {
      p_group_id: groupId,
      p_user_id: targetUserId,
      p_question_id: question.id,
      p_answer: answer,
    });

    if (error) {
      errors.push(`Boonus ${question.question_type}: ${error.message}`);
      continue;
    }

    bonusFilled += 1;
  }

  return { matchesFilled, bonusFilled, skipped, errors };
}
