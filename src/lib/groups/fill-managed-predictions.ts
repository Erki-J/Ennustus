import {
  composerBonusAnswer,
  composerMatchPrediction,
  isPredictableTeamName,
} from "@/lib/predictions/composer-picks";
import { calculatePredictionPoints } from "@/lib/scoring/calculate";
import { isManagedPlayerEmail } from "@/lib/groups/managed-members";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createAdminClient as createAdminClientType } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Match, ScoringSettings } from "@/types/database";

type AdminClient = NonNullable<ReturnType<typeof createAdminClientType>>;

type MatchRow = Pick<
  Match,
  | "id"
  | "home_team"
  | "away_team"
  | "kickoff_at"
  | "home_score"
  | "away_score"
  | "stage"
>;

export type FillManagedPredictionsResult = {
  matchesFilled: number;
  bonusFilled: number;
  skipped: number;
  errors: string[];
};

async function findManagedMembers(
  admin: AdminClient,
  groupId: string,
): Promise<Array<{ user_id: string; nickname: string }>> {
  const { data: withFlag, error: flagError } = await admin
    .from("group_members")
    .select("user_id, nickname, is_managed")
    .eq("group_id", groupId)
    .eq("is_managed", true);

  if (!flagError && withFlag?.length) {
    return withFlag;
  }

  const { data: members } = await admin
    .from("group_members")
    .select("user_id, nickname, profiles ( email )")
    .eq("group_id", groupId);

  if (!members?.length) {
    return [];
  }

  return members.filter((member) => {
    const profile = member.profiles as { email?: string } | { email?: string }[] | null;
    const email = Array.isArray(profile) ? profile[0]?.email : profile?.email;
    return isManagedPlayerEmail(email);
  });
}

async function getGroupAdminUserId(
  admin: AdminClient,
  groupId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("role", "admin")
    .order("joined_at")
    .limit(1)
    .maybeSingle();

  return data?.user_id ?? null;
}

async function getGroupScoring(
  admin: AdminClient,
  groupId: string,
): Promise<ScoringSettings> {
  const { data } = await admin
    .from("group_settings")
    .select("scoring")
    .eq("group_id", groupId)
    .maybeSingle();

  const scoring = data?.scoring as ScoringSettings | undefined;
  return {
    exact_score: scoring?.exact_score ?? 4,
    goal_diff: scoring?.goal_diff ?? 3,
    tendency: scoring?.tendency ?? 2,
    draw_points: scoring?.draw_points ?? 2,
    bonus_points: scoring?.bonus_points ?? 4,
  };
}

export async function fillManagedMemberPredictionsCore(
  admin: AdminClient,
  groupId: string,
  targetUserId: string,
  modifiedByUserId: string,
  options?: { includeBonus?: boolean },
): Promise<FillManagedPredictionsResult> {
  const { data: group } = await admin
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
  const scoring = await getGroupScoring(admin, groupId);

  const { data: matches } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, home_score, away_score, stage")
    .eq("tournament_id", group.tournament_id)
    .gt("kickoff_at", nowIso)
    .order("kickoff_at");

  const { data: existingPredictions } = await admin
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

  for (const match of (matches ?? []) as MatchRow[]) {
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

    const points = calculatePredictionPoints(
      homeGoals,
      awayGoals,
      match.home_score,
      match.away_score,
      scoring,
    );

    const { error } = await admin.from("match_predictions").insert({
      group_id: groupId,
      user_id: targetUserId,
      match_id: match.id,
      home_goals: homeGoals,
      away_goals: awayGoals,
      points,
      last_modified_by: modifiedByUserId,
      modified_by_admin: true,
    });

    if (error) {
      errors.push(`${match.home_team}–${match.away_team}: ${error.message}`);
      continue;
    }

    matchesFilled += 1;
  }

  let bonusFilled = 0;

  if (options?.includeBonus) {
    const { data: bonusQuestions } = await admin
      .from("bonus_questions")
      .select("id, question_type, group_code, sort_order, correct_answer")
      .eq("tournament_id", group.tournament_id)
      .order("sort_order");

    const { data: existingBonus } = await admin
      .from("bonus_predictions")
      .select("question_id")
      .eq("group_id", groupId)
      .eq("user_id", targetUserId);

    const existingBonusIds = new Set(
      (existingBonus ?? []).map((row) => row.question_id),
    );

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

      const points =
        question.correct_answer &&
        answer.toLowerCase() === question.correct_answer.toLowerCase()
          ? scoring.bonus_points
          : 0;

      const { error } = await admin.from("bonus_predictions").insert({
        group_id: groupId,
        user_id: targetUserId,
        question_id: question.id,
        answer,
        points,
        last_modified_by: modifiedByUserId,
        modified_by_admin: true,
      });

      if (error) {
        errors.push(`Boonus ${question.question_type}: ${error.message}`);
        continue;
      }

      bonusFilled += 1;
    }
  }

  return { matchesFilled, bonusFilled, skipped, errors };
}

/** Täidab hallatavate mängijate avatud ennustused (järgmine voor kui meeskonnad on teada). */
export async function syncManagedPlayerPredictionsForGroups(
  admin: AdminClient,
  groupIds: string[],
  tournamentId: string,
): Promise<{ predictionsFilled: number; details: string[] }> {
  let predictionsFilled = 0;
  const details: string[] = [];

  for (const groupId of groupIds) {
    const adminUserId = await getGroupAdminUserId(admin, groupId);
    if (!adminUserId) {
      continue;
    }

    const managedMembers = await findManagedMembers(admin, groupId);
    if (managedMembers.length === 0) {
      continue;
    }

    for (const member of managedMembers) {
      const { count: bonusCount } = await admin
        .from("bonus_predictions")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("user_id", member.user_id);

      const result = await fillManagedMemberPredictionsCore(
        admin,
        groupId,
        member.user_id,
        adminUserId,
        { includeBonus: (bonusCount ?? 0) === 0 },
      );

      if (result.matchesFilled > 0 || result.bonusFilled > 0) {
        predictionsFilled += result.matchesFilled;
        details.push(
          `${member.nickname}: +${result.matchesFilled} mängu` +
            (result.bonusFilled > 0 ? `, +${result.bonusFilled} boonus` : ""),
        );
      }

      details.push(...result.errors.slice(0, 2));
    }
  }

  if (predictionsFilled === 0 && details.length === 0) {
    return { predictionsFilled, details };
  }

  return { predictionsFilled, details };
}

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

  const admin = createAdminClient();
  if (!admin) {
    return {
      matchesFilled: 0,
      bonusFilled: 0,
      skipped: 0,
      errors: ["SUPABASE_SERVICE_ROLE_KEY puudub"],
    };
  }

  const { count: bonusCount } = await admin
    .from("bonus_predictions")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  return fillManagedMemberPredictionsCore(admin, groupId, targetUserId, user.id, {
    includeBonus: (bonusCount ?? 0) === 0,
  });
}
