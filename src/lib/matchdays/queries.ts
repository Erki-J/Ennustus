import { createClient } from "@/lib/supabase/server";
import {
  matchdayLabel,
  matchdayParam,
  parseMatchdayParam,
} from "@/lib/matchdays/labels";
import { compareMatchdayRounds } from "@/lib/matchdays/sort";
import type { Match } from "@/types/database";

const MATCH_SELECT =
  "id, tournament_id, home_team, away_team, kickoff_at, stage, matchday, group_code, sort_order, home_score, away_score, status";

export type MatchdayRound = {
  key: string;
  stage: string;
  matchday: number;
  label: string;
  sort_order: number;
  matches: Match[];
};

export async function getTournamentMatchdays(
  tournamentId: string,
): Promise<MatchdayRound[]> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("tournament_id", tournamentId)
    .order("sort_order");

  if (!matches?.length) {
    return [];
  }

  const rounds = new Map<string, MatchdayRound>();

  for (const match of matches as Match[]) {
    const key = matchdayParam(match.stage, match.matchday);
    const existing = rounds.get(key);

    if (existing) {
      existing.matches.push(match);
      existing.matches.sort((a, b) =>
        a.kickoff_at.localeCompare(b.kickoff_at),
      );
    } else {
      rounds.set(key, {
        key,
        stage: match.stage,
        matchday: match.matchday,
        label: matchdayLabel(match.stage, match.matchday),
        sort_order: match.sort_order,
        matches: [match],
      });
    }
  }

  return [...rounds.values()].sort(compareMatchdayRounds);
}

export function resolveMatchdayRound(
  rounds: MatchdayRound[],
  roundKey?: string,
): MatchdayRound | null {
  if (rounds.length === 0) {
    return null;
  }

  if (roundKey) {
    const parsed = parseMatchdayParam(roundKey);
    if (parsed) {
      const found = rounds.find(
        (round) =>
          round.stage === parsed.stage && round.matchday === parsed.matchday,
      );
      if (found) {
        return found;
      }
    }
  }

  return getActiveMatchdayRound(rounds);
}

export function getActiveMatchdayRound(rounds: MatchdayRound[]): MatchdayRound {
  const now = Date.now();

  for (const round of rounds) {
    const hasOpenMatch = round.matches.some(
      (match) => new Date(match.kickoff_at).getTime() > now,
    );
    if (hasOpenMatch) {
      return round;
    }
  }

  return rounds[rounds.length - 1];
}

export async function getGroupMatchdays(groupId: string) {
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("prediction_groups")
    .select("tournament_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { rounds: [] as MatchdayRound[], tournamentId: null as string | null };
  }

  const rounds = await getTournamentMatchdays(group.tournament_id);

  return { rounds, tournamentId: group.tournament_id };
}
