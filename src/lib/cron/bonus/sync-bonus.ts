import { computeBonusAnswers } from "@/lib/cron/bonus/compute-answers";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Match } from "@/types/database";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export type BonusSyncResult = {
  bonusUpdated: number;
  details: string[];
};

export async function syncTournamentBonusResults(
  admin: AdminClient,
  tournamentId: string,
  matches: Match[],
): Promise<BonusSyncResult> {
  const { data: questions, error } = await admin
    .from("bonus_questions")
    .select("id, question_type, group_code, correct_answer, label")
    .eq("tournament_id", tournamentId)
    .in("question_type", ["group_winner", "tournament_winner", "top_scorer"]);

  if (error) {
    return {
      bonusUpdated: 0,
      details: [`Boonused: ${error.message}`],
    };
  }

  if (!questions?.length) {
    return { bonusUpdated: 0, details: [] };
  }

  const answers = computeBonusAnswers(matches, questions);
  let bonusUpdated = 0;
  const details: string[] = [];

  for (const item of answers) {
    const { data: updated, error: rpcError } = await admin.rpc(
      "cron_set_bonus_correct_answer",
      {
        p_question_id: item.questionId,
        p_correct_answer: item.answer,
      },
    );

    if (rpcError) {
      details.push(`${item.label}: ${rpcError.message}`);
      continue;
    }

    if (updated) {
      bonusUpdated += 1;
      details.push(`${item.label}: ${item.answer}`);
    }
  }

  return { bonusUpdated, details };
}
