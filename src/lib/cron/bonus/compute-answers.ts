import {
  computeGroupWinner,
  computeTopScoringTeam,
  computeTournamentWinner,
} from "@/lib/cron/bonus/standings";
import type { Match } from "@/types/database";

export type BonusQuestionRow = {
  id: string;
  question_type: string;
  group_code: string | null;
  correct_answer: string | null;
  label: string;
};

export type ComputedBonusAnswer = {
  questionId: string;
  answer: string;
  label: string;
};

export function computeBonusAnswers(
  matches: Match[],
  questions: BonusQuestionRow[],
): ComputedBonusAnswer[] {
  const results: ComputedBonusAnswer[] = [];

  for (const question of questions) {
    if (question.correct_answer) {
      continue;
    }

    if (question.question_type === "group_winner" && question.group_code) {
      const groupMatches = matches.filter(
        (match) =>
          match.stage === "group" && match.group_code === question.group_code,
      );
      const winner = computeGroupWinner(groupMatches);
      if (winner) {
        results.push({
          questionId: question.id,
          answer: winner,
          label: question.label,
        });
      }
      continue;
    }

    if (question.question_type === "tournament_winner") {
      const winner = computeTournamentWinner(matches);
      if (winner) {
        results.push({
          questionId: question.id,
          answer: winner,
          label: question.label,
        });
      }
      continue;
    }

    if (question.question_type === "top_scorer") {
      const topTeam = computeTopScoringTeam(matches);
      if (topTeam) {
        results.push({
          questionId: question.id,
          answer: topTeam,
          label: question.label,
        });
      }
    }
  }

  return results;
}
