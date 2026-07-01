import {
  fetchOpenFootballMatches,
  findOpenFootballMatch,
  getOpenFootballUrl,
} from "@/lib/cron/scores/openfootball";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Match, MatchStatus } from "@/types/database";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export type ScoreSyncResult = {
  scoresUpdated: number;
  details: string[];
};

function scoreChanged(
  match: Match,
  homeScore: number,
  awayScore: number,
  status: MatchStatus,
): boolean {
  return (
    match.home_score !== homeScore ||
    match.away_score !== awayScore ||
    match.status !== status
  );
}

async function applyMatchScore(
  admin: AdminClient,
  match: Match,
  homeScore: number,
  awayScore: number,
  status: MatchStatus,
): Promise<string | null> {
  if (!scoreChanged(match, homeScore, awayScore, status)) {
    return null;
  }

  const { error } = await admin.rpc("cron_set_match_result", {
    p_match_id: match.id,
    p_home_score: homeScore,
    p_away_score: awayScore,
    p_status: status,
  });

  if (error) {
    return `${match.home_team}–${match.away_team}: ${error.message}`;
  }

  if (status === "finished") {
    return `${match.home_team}–${match.away_team}: ${homeScore}:${awayScore}, punktid uuendatud`;
  }

  return `${match.home_team}–${match.away_team}: ${homeScore}:${awayScore}, live`;
}

export async function syncTournamentScores(
  admin: AdminClient,
  tournamentSlug: string,
  matches: Match[],
  now = Date.now(),
): Promise<ScoreSyncResult> {
  const details: string[] = [];
  let scoresUpdated = 0;

  const sourceUrl = getOpenFootballUrl(tournamentSlug);
  if (!sourceUrl) {
    details.push(`Turniir ${tournamentSlug}: openfootball allikas puudub`);
    return { scoresUpdated, details };
  }

  const eligibleMatches = matches.filter((match) => {
    if (match.status === "finished") {
      return false;
    }

    return new Date(match.kickoff_at).getTime() <= now;
  });

  if (eligibleMatches.length === 0) {
    return { scoresUpdated, details };
  }

  let externalMatches;
  try {
    externalMatches = await fetchOpenFootballMatches(tournamentSlug);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tundmatu viga";
    details.push(`OpenFootball: ${message}`);
    return { scoresUpdated, details };
  }

  for (const match of eligibleMatches) {
    const external = findOpenFootballMatch(
      match.home_team,
      match.away_team,
      match.kickoff_at,
      externalMatches,
    );

    if (!external) {
      continue;
    }

    if (
      external.finished &&
      external.homeScore !== null &&
      external.awayScore !== null
    ) {
      const detail = await applyMatchScore(
        admin,
        match,
        external.homeScore,
        external.awayScore,
        "finished",
      );

      if (detail) {
        scoresUpdated += 1;
        details.push(detail);
      }
    }
  }

  if (scoresUpdated === 0 && eligibleMatches.length > 0) {
    details.push(
      "OpenFootball: lõplikke tulemusi veel pole (mäng võib veel käia).",
    );
  }

  return { scoresUpdated, details };
}
