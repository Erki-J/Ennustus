import {
  isDynamicBracketSlot,
  isTeamPlaceholder,
  WC2026_KNOCKOUT_BRACKET,
  type BracketSlot,
} from "@/lib/cron/bracket/definitions";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Match } from "@/types/database";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export type KnockoutTeamsSyncResult = {
  teamsUpdated: number;
  details: string[];
};

function getMatchWinner(match: Match): string | null {
  if (
    match.status !== "finished" ||
    match.home_score == null ||
    match.away_score == null ||
    match.home_score === match.away_score
  ) {
    return null;
  }

  return match.home_score > match.away_score ? match.home_team : match.away_team;
}

function getMatchLoser(match: Match): string | null {
  if (
    match.status !== "finished" ||
    match.home_score == null ||
    match.away_score == null ||
    match.home_score === match.away_score
  ) {
    return null;
  }

  return match.home_score > match.away_score ? match.away_team : match.home_team;
}

function resolveBracketSlot(
  slot: BracketSlot,
  matchesByNum: Map<number, Match>,
): string | null {
  if (slot.type === "team") {
    return slot.name;
  }

  const source = matchesByNum.get(slot.matchNum);
  if (!source) {
    return null;
  }

  return slot.type === "winner" ? getMatchWinner(source) : getMatchLoser(source);
}

function shouldUpdateTeam(
  slot: BracketSlot,
  currentName: string,
  resolvedName: string,
): boolean {
  if (currentName === resolvedName) {
    return false;
  }

  if (isDynamicBracketSlot(slot)) {
    return true;
  }

  return isTeamPlaceholder(currentName);
}

const KNOCKOUT_STAGE_RANGES: Array<{ stage: string; start: number; end: number }> = [
  { stage: "round_32", start: 73, end: 88 },
  { stage: "round_16", start: 89, end: 96 },
  { stage: "quarter", start: 97, end: 100 },
  { stage: "semi", start: 101, end: 102 },
  { stage: "third", start: 103, end: 103 },
  { stage: "final", start: 104, end: 104 },
];

export function indexKnockoutMatchesByBracketNum(
  matches: Match[],
): Map<number, Match> {
  const bySortOrder = new Map<number, Match>();

  for (const match of matches) {
    if (match.sort_order >= 73) {
      bySortOrder.set(match.sort_order, match);
    }
  }

  if (bySortOrder.has(73)) {
    return bySortOrder;
  }

  const byStage = new Map<number, Match>();

  for (const { stage, start, end } of KNOCKOUT_STAGE_RANGES) {
    const stageMatches = matches
      .filter((match) => match.stage === stage)
      .sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));

    stageMatches.forEach((match, index) => {
      const matchNum = start + index;
      if (matchNum <= end) {
        byStage.set(matchNum, match);
      }
    });
  }

  return byStage;
}

export function buildKnockoutUpdates(
  matches: Match[],
  bracket = WC2026_KNOCKOUT_BRACKET,
): Array<{ matchId: string; home_team?: string; away_team?: string; label: string }> {
  const matchesByNum = indexKnockoutMatchesByBracketNum(matches);

  const updates: Array<{
    matchId: string;
    home_team?: string;
    away_team?: string;
    label: string;
  }> = [];

  for (const def of bracket) {
    const match = matchesByNum.get(def.matchNum);
    if (!match) {
      continue;
    }

    const resolvedHome = resolveBracketSlot(def.home, matchesByNum);
    const resolvedAway = resolveBracketSlot(def.away, matchesByNum);
    const patch: { home_team?: string; away_team?: string } = {};

    if (
      resolvedHome &&
      shouldUpdateTeam(def.home, match.home_team, resolvedHome)
    ) {
      patch.home_team = resolvedHome;
    }

    if (
      resolvedAway &&
      shouldUpdateTeam(def.away, match.away_team, resolvedAway)
    ) {
      patch.away_team = resolvedAway;
    }

    if (Object.keys(patch).length === 0) {
      continue;
    }

    const nextHome = patch.home_team ?? match.home_team;
    const nextAway = patch.away_team ?? match.away_team;

    updates.push({
      matchId: match.id,
      ...patch,
      label: `${match.home_team}–${match.away_team} → ${nextHome}–${nextAway}`,
    });
  }

  return updates;
}

export async function syncKnockoutTeams(
  admin: AdminClient,
  tournamentSlug: string,
  matches: Match[],
): Promise<KnockoutTeamsSyncResult> {
  if (tournamentSlug !== "wc-2026") {
    return { teamsUpdated: 0, details: [] };
  }

  const pending = buildKnockoutUpdates(matches);
  let teamsUpdated = 0;
  const details: string[] = [];

  for (const update of pending) {
    const { matchId, label, home_team, away_team } = update;
    const patch: { home_team?: string; away_team?: string } = {};

    if (home_team) {
      patch.home_team = home_team;
    }
    if (away_team) {
      patch.away_team = away_team;
    }

    const { error } = await admin.from("matches").update(patch).eq("id", matchId);

    if (error) {
      details.push(`Bracket ${label}: ${error.message}`);
      continue;
    }

    teamsUpdated += Object.keys(patch).length;
    details.push(`Bracket: ${label}`);
  }

  return { teamsUpdated, details };
}
