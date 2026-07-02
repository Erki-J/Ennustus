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

export function buildKnockoutUpdates(
  matches: Match[],
  bracket = WC2026_KNOCKOUT_BRACKET,
): Array<{ matchId: string; home_team?: string; away_team?: string; label: string }> {
  const matchesByNum = new Map<number, Match>();

  for (const match of matches) {
    if (match.sort_order >= bracket[0]?.matchNum) {
      matchesByNum.set(match.sort_order, match);
    }
  }

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
