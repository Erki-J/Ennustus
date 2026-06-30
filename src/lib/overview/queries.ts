import { getBonusPointsByUser } from "@/lib/bonus/queries";
import { getGroupContext } from "@/lib/groups/context";
import {
  getGroupMatchdays,
  resolveMatchdayRound,
} from "@/lib/matchdays/queries";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/types/database";

export type OverviewCell = {
  home_goals: number;
  away_goals: number;
  points: number;
} | null;

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

  const { rounds } = await getGroupMatchdays(groupId);
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

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, nickname")
    .eq("group_id", groupId)
    .order("nickname");

  const { data: roundPredictions } = await supabase
    .from("match_predictions")
    .select("user_id, match_id, home_goals, away_goals, points")
    .eq("group_id", groupId)
    .in("match_id", matchIds);

  const { data: allPredictions } = await supabase
    .from("match_predictions")
    .select("user_id, points")
    .eq("group_id", groupId);

  const predictionMap = new Map<string, OverviewCell>();
  for (const prediction of roundPredictions ?? []) {
    predictionMap.set(`${prediction.user_id}:${prediction.match_id}`, {
      home_goals: prediction.home_goals,
      away_goals: prediction.away_goals,
      points: prediction.points,
    });
  }

  const matchTotals = new Map<string, number>();
  for (const prediction of allPredictions ?? []) {
    matchTotals.set(
      prediction.user_id,
      (matchTotals.get(prediction.user_id) ?? 0) + prediction.points,
    );
  }

  const bonusTotals = await getBonusPointsByUser(groupId);

  const rows: OverviewRow[] = (members ?? []).map((member) => {
    const cells = matches.map(
      (match) => predictionMap.get(`${member.user_id}:${match.id}`) ?? null,
    );
    const round_points = cells.reduce(
      (sum, cell) => sum + (cell?.points ?? 0),
      0,
    );
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

  const now = Date.now();
  const startedMatchIds = new Set(
    matches
      .filter((match) => new Date(match.kickoff_at).getTime() <= now)
      .map((match) => match.id),
  );

  return { context, rounds, round, rows, startedMatchIds };
}
