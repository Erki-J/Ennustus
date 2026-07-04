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
  if (match.home_score == null || match.away_score == null) {
    return null;
  }

  if (match.home_score === match.away_score) {
    return null;
  }

  const kickoffPassed = new Date(match.kickoff_at).getTime() <= Date.now();
  const decided =
    match.status === "finished" ||
    (kickoffPassed &&
      match.status !== "live" &&
      match.home_score !== null &&
      match.away_score !== null);

  if (!decided) {
    return null;
  }

  return match.home_score > match.away_score ? match.home_team : match.away_team;
}

function getMatchLoser(match: Match): string | null {
  if (match.home_score == null || match.away_score == null) {
    return null;
  }

  if (match.home_score === match.away_score) {
    return null;
  }

  const kickoffPassed = new Date(match.kickoff_at).getTime() <= Date.now();
  const decided =
    match.status === "finished" ||
    (kickoffPassed &&
      match.status !== "live" &&
      match.home_score !== null &&
      match.away_score !== null);

  if (!decided) {
    return null;
  }

  return match.home_score > match.away_score ? match.away_team : match.home_team;
}

function teamsMatchPair(
  match: Match,
  home: string,
  away: string,
): boolean {
  return (
    (match.home_team === home && match.away_team === away) ||
    (match.home_team === away && match.away_team === home)
  );
}

function findBracketSourceMatch(
  matchNum: number,
  matchesByNum: Map<number, Match>,
  allMatches: Match[],
  bracket: typeof WC2026_KNOCKOUT_BRACKET,
): Match | undefined {
  const mapped = matchesByNum.get(matchNum);
  const def = bracket.find((item) => item.matchNum === matchNum);

  if (!def || def.home.type !== "team" || def.away.type !== "team") {
    return mapped;
  }

  const homeName = def.home.name;
  const awayName = def.away.name;

  if (mapped && teamsMatchPair(mapped, homeName, awayName)) {
    return mapped;
  }

  return allMatches.find(
    (match) =>
      match.stage === "round_32" &&
      teamsMatchPair(match, homeName, awayName),
  );
}

function resolveBracketSlot(
  slot: BracketSlot,
  matchesByNum: Map<number, Match>,
  allMatches: Match[],
  bracket: typeof WC2026_KNOCKOUT_BRACKET,
): string | null {
  if (slot.type === "team") {
    return slot.name;
  }

  const source = findBracketSourceMatch(slot.matchNum, matchesByNum, allMatches, bracket);
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
  bracket = WC2026_KNOCKOUT_BRACKET,
): Map<number, Match> {
  const bySortOrder = new Map<number, Match>();

  for (const match of matches) {
    if (match.sort_order >= 73) {
      bySortOrder.set(match.sort_order, match);
    }
  }

  for (const def of bracket) {
    if (def.matchNum < 73 || def.matchNum > 88) {
      continue;
    }
    if (def.home.type !== "team" || def.away.type !== "team") {
      continue;
    }

    const homeName = def.home.name;
    const awayName = def.away.name;

    const mapped = bySortOrder.get(def.matchNum);
    if (mapped && teamsMatchPair(mapped, homeName, awayName)) {
      continue;
    }

    const found = matches.find(
      (match) =>
        match.stage === "round_32" &&
        teamsMatchPair(match, homeName, awayName),
    );

    if (found) {
      bySortOrder.set(def.matchNum, found);
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
  const matchesByNum = indexKnockoutMatchesByBracketNum(matches, bracket);

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

    const resolvedHome = resolveBracketSlot(def.home, matchesByNum, matches, bracket);
    const resolvedAway = resolveBracketSlot(def.away, matchesByNum, matches, bracket);
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

function isSourceMatchReady(source: Match): boolean {
  return (
    !isTeamPlaceholder(source.home_team) &&
    !isTeamPlaceholder(source.away_team)
  );
}

function resolveBracketSlotResult(
  slot: BracketSlot,
  source: Match,
): string | null {
  if (slot.type === "winner") {
    return getMatchWinner(source);
  }

  if (slot.type === "loser") {
    return getMatchLoser(source);
  }

  return null;
}

/** Diagnostika: ainult need lüngad, mida saab praegu lahendada (allikmängul on meeskonnad). */
export function describeBracketGaps(
  matches: Match[],
  bracket = WC2026_KNOCKOUT_BRACKET,
): string[] {
  const matchesByNum = indexKnockoutMatchesByBracketNum(matches, bracket);
  const details: Array<{ kickoff: string; message: string }> = [];

  for (const def of bracket) {
    const match = matchesByNum.get(def.matchNum);
    if (!match) {
      continue;
    }

    if (
      !isTeamPlaceholder(match.home_team) &&
      !isTeamPlaceholder(match.away_team)
    ) {
      continue;
    }

    for (const [side, slot] of [
      ["home", def.home],
      ["away", def.away],
    ] as const) {
      if (slot.type !== "winner" && slot.type !== "loser") {
        continue;
      }

      const current = side === "home" ? match.home_team : match.away_team;
      if (!isTeamPlaceholder(current)) {
        continue;
      }

      const source = findBracketSourceMatch(
        slot.matchNum,
        matchesByNum,
        matches,
        bracket,
      );

      if (!source || !isSourceMatchReady(source)) {
        continue;
      }

      const resolved = resolveBracketSlotResult(slot, source);
      if (resolved) {
        continue;
      }

      const hasScore =
        source.home_score != null && source.away_score != null;
      const isDraw = hasScore && source.home_score === source.away_score;

      if (isDraw) {
        details.push({
          kickoff: match.kickoff_at,
          message: `Mäng ${def.matchNum}: oota mängu ${slot.matchNum} penaltitulemust (${source.home_team}–${source.away_team} ${source.home_score}:${source.away_score})`,
        });
        continue;
      }

      details.push({
        kickoff: match.kickoff_at,
        message: `Mäng ${def.matchNum}: oota mängu ${slot.matchNum} tulemust (${source.home_team}–${source.away_team}, ${source.status})`,
      });
    }
  }

  return details
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .map((item) => item.message);
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

  if (teamsUpdated === 0) {
    const gaps = describeBracketGaps(matches);
    details.push(...gaps.slice(0, 3));
  }

  return { teamsUpdated, details };
}
