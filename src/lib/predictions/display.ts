export type MatchPredictionCell = {
  home_goals: number;
  away_goals: number;
  points: number;
} | null;

export type MatchPredictionCellDisplay =
  | { kind: "empty" }
  | { kind: "hidden" }
  | {
      kind: "score";
      home_goals: number;
      away_goals: number;
      points: number;
    };

export function getMatchPredictionCellDisplay(
  cell: MatchPredictionCell,
  matchStarted: boolean,
): MatchPredictionCellDisplay {
  if (!cell) {
    return { kind: "empty" };
  }

  if (!matchStarted) {
    return { kind: "hidden" };
  }

  return {
    kind: "score",
    home_goals: cell.home_goals,
    away_goals: cell.away_goals,
    points: cell.points,
  };
}
