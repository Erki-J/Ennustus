import { getBonusPointsByUser } from "@/lib/bonus/queries";
import { getGroupContext } from "@/lib/groups/context";
import { getLocale } from "@/lib/i18n/server";
import {
  getGroupMatchdays,
  resolveMatchdayRound,
} from "@/lib/matchdays/queries";
import type { MatchPredictionCell } from "@/lib/predictions/display";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/types/database";

export type OverviewCell = MatchPredictionCell;

export type OverviewRow = {
  user_id: string;
  nickname: string;
  cells: OverviewCell[];
  round_points: number;
  bonus_points: number;
  total_points: number;
};

export async function getMatchdayOverview(groupId: string, roundKey?: string) {
  const context = await getGroupContext(groupId);

  if (!context) {
    return null;
  }

  const locale = await getLocale();
  const { rounds } = await getGroupMatchdays(groupId, locale);
  const round = resolveMatchdayRound(rounds, roundKey);

  if (!round) {
    return {
      context,
      rounds,
      round: null,
      rows: [] as OverviewRow[],
      startedMatchIds: new Set<string>(),
    };
  }

  const supabase = await createClient();
  const matches = round.matches as Match[];
  const matchIds = matches.map((match) => match.id);

  const now = Date.now();
  const startedMatchIds = new Set(
    matches
      .filter((match) => new Date(match.kickoff_at).getTime() <= now)
      .map((match) => match.id),
  );

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, nickname")
    .eq("group_id", groupId)
    .order("nickname");

  const { data: roundPredictions } = await supabase.rpc("get_overview_round_predictions", {
    p_group_id: groupId,
    p_match_ids: matchIds,
  });

  const { data: matchPointTotals } = await supabase.rpc("get_overview_match_point_totals", {
    p_group_id: groupId,
  });

  type PredictionRow = {
    user_id: string;
    match_id: string;
    home_goals: number | null;
    away_goals: number | null;
    points: number;
  };

  const predictionMap = new Map<
    string,
    { home_goals: number | null; away_goals: number | null; points: number }
  >();
  for (const prediction of (roundPredictions ?? []) as PredictionRow[]) {
    predictionMap.set(`${prediction.user_id}:${prediction.match_id}`, {
      home_goals: prediction.home_goals,
      away_goals: prediction.away_goals,
      points: prediction.points,
    });
  }

  const matchTotals = new Map<string, number>();
  for (const row of matchPointTotals ?? []) {
    matchTotals.set(row.user_id, row.total_points);
  }

  const bonusTotals = await getBonusPointsByUser(groupId);

  const rows: OverviewRow[] = (members ?? []).map((member) => {
    const cells: MatchPredictionCell[] = matches.map((match) => {
      const prediction = predictionMap.get(`${member.user_id}:${match.id}`);
      if (!prediction) {
        return null;
      }

      if (!startedMatchIds.has(match.id)) {
        return { pending: true };
      }

      return {
        home_goals: prediction.home_goals ?? 0,
        away_goals: prediction.away_goals ?? 0,
        points: prediction.points,
      };
    });

    const round_points = cells.reduce((sum, cell, cellIndex) => {
      if (!cell || "pending" in cell) {
        return sum;
      }

      const match = matches[cellIndex];
      if (match.home_score === null || match.away_score === null) {
        return sum;
      }

      return sum + cell.points;
    }, 0);
    const bonus_points = bonusTotals.get(member.user_id) ?? 0;
    const total_points = (matchTotals.get(member.user_id) ?? 0) + bonus_points;

    return {
      user_id: member.user_id,
      nickname: member.nickname,
      cells,
      round_points,
      bonus_points,
      total_points,
    };
  });

  rows.sort((a, b) => b.total_points - a.total_points);

  return { context, rounds, round, rows, startedMatchIds };
}
