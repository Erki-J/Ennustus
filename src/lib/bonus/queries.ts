import { createClient } from "@/lib/supabase/server";
import { getGroupContext } from "@/lib/groups/context";

export type BonusQuestionType =
  | "group_winner"
  | "tournament_winner"
  | "top_scorer"
  | "semifinalist";

export type BonusQuestion = {
  id: string;
  tournament_id: string;
  question_type: BonusQuestionType;
  label: string;
  group_code: string | null;
  sort_order: number;
  points_value: number;
  correct_answer: string | null;
};

export type BonusPrediction = {
  question_id: string;
  answer: string;
  points: number;
};

export type BonusQuestionWithPrediction = BonusQuestion & {
  my_answer: string | null;
  my_points: number;
};

export async function isBonusLocked(tournamentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_bonus_locked", {
    p_tournament_id: tournamentId,
  });

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function getBonusCentre(groupId: string) {
  const context = await getGroupContext(groupId);

  if (!context) {
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

  const locked = await isBonusLocked(group.tournament_id);

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
    .eq("user_id", context.userId);

  const predictionMap = new Map(
    (predictions ?? []).map((prediction) => [prediction.question_id, prediction]),
  );

  const items: BonusQuestionWithPrediction[] = (questions ?? []).map((question) => {
    const mine = predictionMap.get(question.id);
    return {
      ...question,
      question_type: question.question_type as BonusQuestionType,
      my_answer: mine?.answer ?? null,
      my_points: mine?.points ?? 0,
    };
  });

  return {
    context,
    locked,
    groupWinners: items.filter((item) => item.question_type === "group_winner"),
    tournamentWinner: items.find((item) => item.question_type === "tournament_winner"),
    topScorer: items.find((item) => item.question_type === "top_scorer"),
    semifinalists: items.filter((item) => item.question_type === "semifinalist"),
  };
}

export async function getBonusPointsByUser(groupId: string) {
  const supabase = await createClient();

  const { data: predictions } = await supabase
    .from("bonus_predictions")
    .select("user_id, points")
    .eq("group_id", groupId);

  const totals = new Map<string, number>();
  for (const prediction of predictions ?? []) {
    totals.set(
      prediction.user_id,
      (totals.get(prediction.user_id) ?? 0) + prediction.points,
    );
  }

  return totals;
}

export type BonusLeaderboardRow = {
  user_id: string;
  nickname: string;
  cells: Array<{ answer: string | null; points: number }>;
  match_points: number;
  bonus_points: number;
  total_points: number;
};

export async function getBonusLeaderboard(groupId: string) {
  const context = await getGroupContext(groupId);

  if (!context) {
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

  const locked = await isBonusLocked(group.tournament_id);

  const { data: questions } = await supabase
    .from("bonus_questions")
    .select(
      "id, tournament_id, question_type, label, group_code, sort_order, points_value, correct_answer",
    )
    .eq("tournament_id", group.tournament_id)
    .order("sort_order");

  const allQuestions = (questions ?? []) as BonusQuestion[];

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, nickname")
    .eq("group_id", groupId)
    .order("nickname");

  const { data: predictions } = await supabase
    .from("bonus_predictions")
    .select("user_id, question_id, answer, points")
    .eq("group_id", groupId);

  const { data: matchPredictions } = await supabase
    .from("match_predictions")
    .select("user_id, points")
    .eq("group_id", groupId);

  const predictionMap = new Map<string, { answer: string; points: number }>();
  for (const prediction of predictions ?? []) {
    predictionMap.set(`${prediction.user_id}:${prediction.question_id}`, {
      answer: prediction.answer,
      points: prediction.points,
    });
  }

  const matchTotals = new Map<string, number>();
  for (const prediction of matchPredictions ?? []) {
    matchTotals.set(
      prediction.user_id,
      (matchTotals.get(prediction.user_id) ?? 0) + prediction.points,
    );
  }

  const rows: BonusLeaderboardRow[] = (members ?? []).map((member) => {
    const cells = allQuestions.map((question) => {
      const cell = predictionMap.get(`${member.user_id}:${question.id}`);
      return {
        answer: cell?.answer ?? null,
        points: cell?.points ?? 0,
      };
    });

    const bonus_points = cells.reduce((sum, cell) => sum + cell.points, 0);
    const match_points = matchTotals.get(member.user_id) ?? 0;

    return {
      user_id: member.user_id,
      nickname: member.nickname,
      cells,
      match_points,
      bonus_points,
      total_points: match_points + bonus_points,
    };
  });

  rows.sort((a, b) => b.total_points - a.total_points);

  return {
    context,
    locked,
    questions: allQuestions,
    rows,
  };
}

export async function getBonusQuestionsForAdmin(groupId: string) {
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

  const { data: questions } = await supabase
    .from("bonus_questions")
    .select(
      "id, tournament_id, question_type, label, group_code, sort_order, points_value, correct_answer",
    )
    .eq("tournament_id", group.tournament_id)
    .order("sort_order");

  return {
    context,
    questions: (questions ?? []) as BonusQuestion[],
  };
}
