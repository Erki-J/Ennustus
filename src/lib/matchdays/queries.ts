import { cache } from "react";
import {
  buildKnockoutUpdates,
  syncKnockoutTeams,
} from "@/lib/cron/bracket/sync-teams";
import {
  matchdayLabel,
  matchdayParam,
  parseMatchdayParam,
} from "@/lib/matchdays/labels";
import { compareMatchdayRounds } from "@/lib/matchdays/sort";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/settings/locale";
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
  locale: AppLocale = "et",
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
        label: matchdayLabel(match.stage, match.matchday, locale),
        sort_order: match.sort_order,
        matches: [match],
      });
    }
  }

  return [...rounds.values()].sort(compareMatchdayRounds);
}

async function ensureKnockoutTeamsSynced(tournamentId: string, slug: string | null) {
  if (slug !== "wc-2026") {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { data: matches } = await admin
    .from("matches")
    .select(MATCH_SELECT)
    .eq("tournament_id", tournamentId);

  if (!matches?.length) {
    return;
  }

  const typedMatches = matches as Match[];
  const pending = buildKnockoutUpdates(typedMatches);

  if (pending.length === 0) {
    return;
  }

  await syncKnockoutTeams(admin, slug, typedMatches);
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

export type GroupMatchdaysResult = {
  rounds: MatchdayRound[];
  tournamentId: string | null;
};

const getGroupMatchdaysImpl = cache(
  async (groupId: string, locale: AppLocale = "et"): Promise<GroupMatchdaysResult> => {
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("prediction_groups")
    .select("tournament_id, tournament:tournaments(slug)")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { rounds: [] as MatchdayRound[], tournamentId: null as string | null };
  }

  const tournamentSlug =
    group.tournament &&
    typeof group.tournament === "object" &&
    "slug" in group.tournament
      ? String(group.tournament.slug)
      : null;

  await ensureKnockoutTeamsSynced(group.tournament_id, tournamentSlug);

  const rounds = await getTournamentMatchdays(group.tournament_id, locale);

  return { rounds, tournamentId: group.tournament_id };
  },
);

export async function getGroupMatchdays(
  groupId: string,
  locale: AppLocale = "et",
): Promise<GroupMatchdaysResult> {
  return getGroupMatchdaysImpl(groupId, locale);
}
