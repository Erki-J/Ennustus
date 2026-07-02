import type { MatchStatus } from "@/types/database";

export type ExternalMatchScore = {
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  source: "openfootball" | "football-data" | "api-football";
};

export function pickExternalScore(
  candidates: Array<ExternalMatchScore | null | undefined>,
): ExternalMatchScore | null {
  const scores = candidates.filter(
    (score): score is ExternalMatchScore => score !== null && score !== undefined,
  );

  if (scores.length === 0) {
    return null;
  }

  const finished = scores.find((score) => score.status === "finished");
  if (finished) {
    return finished;
  }

  return scores[0] ?? null;
}
