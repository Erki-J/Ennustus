import type { ScoringSettings } from "@/types/database";

export function calculatePredictionPoints(
  homeGoals: number,
  awayGoals: number,
  actualHome: number | null,
  actualAway: number | null,
  scoring: ScoringSettings,
): number {
  if (actualHome === null || actualAway === null) {
    return 0;
  }

  if (homeGoals === actualHome && awayGoals === actualAway) {
    return scoring.exact_score;
  }

  const predDiff = homeGoals - awayGoals;
  const actualDiff = actualHome - actualAway;

  // Viik: tegelik tulemus ja ennustus on mõlemad viigid, aga skoor erineb (nt 1:1 vs 2:2)
  if (actualDiff === 0 && predDiff === 0) {
    return scoring.draw_points;
  }

  if (predDiff === actualDiff) {
    return scoring.goal_diff;
  }

  if (Math.sign(predDiff) === Math.sign(actualDiff)) {
    return scoring.tendency;
  }

  return 0;
}

export function isMatchLocked(kickoffAt: string): boolean {
  return new Date(kickoffAt) <= new Date();
}

export function isMatchStarted(kickoffAt: string): boolean {
  return new Date(kickoffAt) <= new Date();
}

export function formatMatchScore(
  homeScore: number | null,
  awayScore: number | null,
): string {
  if (homeScore === null || awayScore === null) {
    return "–";
  }
  return `${homeScore}:${awayScore}`;
}

export function formatPrediction(home: number, away: number): string {
  return `${home}:${away}`;
}
