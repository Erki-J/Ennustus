import {
  pickExternalScore,
  type ExternalMatchScore,
} from "@/lib/cron/scores/external-score";
import {
  fetchApiFootballFixtures,
  findApiFootballScore,
  hasApiFootballConfig,
  type ApiFootballFixture,
} from "@/lib/cron/scores/api-football";
import {
  fetchFootballDataScores,
  findFootballDataScore,
  type FootballDataMatch,
} from "@/lib/cron/scores/football-data";
import {
  fetchOpenFootballMatches,
  findOpenFootballScore,
  getOpenFootballUrl,
  type OpenFootballMatch,
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
  external: ExternalMatchScore,
): Promise<string | null> {
  if (
    !scoreChanged(
      match,
      external.homeScore,
      external.awayScore,
      external.status,
    )
  ) {
    return null;
  }

  const { error } = await admin.rpc("cron_set_match_result", {
    p_match_id: match.id,
    p_home_score: external.homeScore,
    p_away_score: external.awayScore,
    p_status: external.status,
  });

  if (error) {
    return `${match.home_team}–${match.away_team}: ${error.message}`;
  }

  if (external.status === "finished") {
    return `${match.home_team}–${match.away_team}: ${external.homeScore}:${external.awayScore}, punktid uuendatud (${external.source})`;
  }

  return `${match.home_team}–${match.away_team}: ${external.homeScore}:${external.awayScore}, live (${external.source})`;
}

function kickoffDate(iso: string): string {
  return iso.slice(0, 10);
}

export async function syncTournamentScores(
  admin: AdminClient,
  tournamentSlug: string,
  matches: Match[],
  now = Date.now(),
): Promise<ScoreSyncResult> {
  const details: string[] = [];
  let scoresUpdated = 0;

  const eligibleMatches = matches.filter((match) => {
    if (match.status === "finished") {
      return false;
    }

    return new Date(match.kickoff_at).getTime() <= now;
  });

  if (eligibleMatches.length === 0) {
    return { scoresUpdated, details };
  }

  const hasOpenFootball = Boolean(getOpenFootballUrl(tournamentSlug));
  const hasFootballData = Boolean(process.env.FOOTBALL_DATA_API_KEY);
  const hasApiFootball = hasApiFootballConfig(tournamentSlug);

  if (!hasOpenFootball && !hasFootballData && !hasApiFootball) {
    details.push(
      "Skooride allikas puudub (API_FOOTBALL_KEY, FOOTBALL_DATA_API_KEY või openfootball).",
    );
    return { scoresUpdated, details };
  }

  const kickoffDates = eligibleMatches.map((match) => kickoffDate(match.kickoff_at));

  let apiFootballFixtures: ApiFootballFixture[] = [];
  if (hasApiFootball) {
    try {
      apiFootballFixtures = await fetchApiFootballFixtures(
        tournamentSlug,
        kickoffDates,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tundmatu viga";
      details.push(message);
    }
  }

  let openFootballMatches: OpenFootballMatch[] = [];
  if (hasOpenFootball) {
    try {
      openFootballMatches = await fetchOpenFootballMatches(tournamentSlug);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tundmatu viga";
      details.push(`OpenFootball: ${message}`);
    }
  }

  let footballDataMatches: FootballDataMatch[] = [];
  if (hasFootballData) {
    try {
      footballDataMatches = await fetchFootballDataScores(kickoffDates);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tundmatu viga";
      details.push(`football-data.org: ${message}`);
    }
  }

  for (const match of eligibleMatches) {
    const external = pickExternalScore([
      findApiFootballScore(
        match.home_team,
        match.away_team,
        match.kickoff_at,
        apiFootballFixtures,
      ),
      findFootballDataScore(
        match.home_team,
        match.away_team,
        match.kickoff_at,
        footballDataMatches,
      ),
      findOpenFootballScore(
        match.home_team,
        match.away_team,
        match.kickoff_at,
        openFootballMatches,
      ),
    ]);

    if (!external) {
      continue;
    }

    const detail = await applyMatchScore(admin, match, external);
    if (detail) {
      scoresUpdated += 1;
      details.push(detail);
    }
  }

  if (scoresUpdated === 0 && eligibleMatches.length > 0) {
    if (hasApiFootball || hasFootballData) {
      details.push(
        "Live skoori allikast veel tulemust ei leitud (mäng võib alles käia).",
      );
    } else {
      details.push(
        "Live skoori jaoks lisa Vercelisse API_FOOTBALL_KEY või FOOTBALL_DATA_API_KEY.",
      );
    }
  }

  return { scoresUpdated, details };
}
