import { createClient } from "@/lib/supabase/server";
import { getGroupContext } from "@/lib/groups/context";
import { getLocale } from "@/lib/i18n/server";
import {
  getGroupMatchdays,
  resolveMatchdayRound,
} from "@/lib/matchdays/queries";
import type { Match, MatchPrediction } from "@/types/database";

export type MatchWithPrediction = Match & {
  my_prediction: Pick<
    MatchPrediction,
    "home_goals" | "away_goals" | "points"
  > | null;
  locked: boolean;
  started: boolean;
};

export async function getPredictionCentreMatches(
  groupId: string,
  roundKey?: string,
): Promise<MatchWithPrediction[]> {
  const context = await getGroupContext(groupId);

  if (!context) {
    return [];
  }

  const locale = await getLocale();
  const { rounds } = await getGroupMatchdays(groupId, locale);

  let matches: Match[];
  if (roundKey) {
    const round = resolveMatchdayRound(rounds, roundKey);
    if (!round) {
      return [];
    }
    matches = round.matches;
  } else {
    matches = rounds.flatMap((round) => round.matches);
  }

  const supabase = await createClient();

  const { data: predictions } = await supabase
    .from("match_predictions")
    .select("match_id, home_goals, away_goals, points")
    .eq("group_id", groupId)
    .eq("user_id", context.userId);

  const predictionMap = new Map(
    (predictions ?? []).map((prediction) => [prediction.match_id, prediction]),
  );

  const now = Date.now();

  return matches.map((match) => {
    const kickoff = new Date(match.kickoff_at).getTime();
    const myPrediction = predictionMap.get(match.id);

    return {
      ...match,
      my_prediction: myPrediction
        ? {
            home_goals: myPrediction.home_goals,
            away_goals: myPrediction.away_goals,
            points: myPrediction.points,
          }
        : null,
      locked: kickoff <= now,
      started: kickoff <= now,
    };
  });
}
