export const ADMIN_PREDICTIONS_BONUS_SECTION = "bonus";

export type AdminRoundMatches = {
  key: string;
  label: string;
  matches: Array<{
    id: string;
    home_team: string;
    away_team: string;
    kickoff_at: string;
  }>;
};

export type AdminPredictionEntry = {
  home_goals: number;
  away_goals: number;
};

export type AdminMatchPredictionsPanel = {
  selectedSection: string;
  matches: AdminRoundMatches["matches"];
  predictions: Array<{
    match_id: string;
    home_goals: number;
    away_goals: number;
  }>;
};

export function buildAdminMatchPredictionsPanel(
  userId: string,
  section: string,
  rounds: AdminRoundMatches[],
  predictionMap: Record<string, AdminPredictionEntry>,
): AdminMatchPredictionsPanel {
  const round =
    rounds.find((item) => item.key === section) ??
    rounds[0];

  if (!round) {
    return { selectedSection: section, matches: [], predictions: [] };
  }

  return {
    selectedSection: round.key,
    matches: round.matches,
    predictions: round.matches.map((match) => {
      const prediction = predictionMap[`${userId}:${match.id}`];
      return {
        match_id: match.id,
        home_goals: prediction?.home_goals ?? 0,
        away_goals: prediction?.away_goals ?? 0,
      };
    }),
  };
}

export function serializeAdminPredictionMap(
  predictionMap: Map<string, AdminPredictionEntry>,
): Record<string, AdminPredictionEntry> {
  return Object.fromEntries(predictionMap);
}
