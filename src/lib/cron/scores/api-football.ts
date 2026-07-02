import { matchesTeamName } from "@/lib/cron/scores/team-names";
import type { ExternalMatchScore } from "@/lib/cron/scores/external-score";

export type ApiFootballFixture = {
  fixture: {
    date: string;
    status: {
      short: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
};

type ApiFootballResponse = {
  errors?: unknown;
  response?: ApiFootballFixture[];
};

const TOURNAMENT_CONFIG: Record<string, { league: number; season: number }> = {
  "wc-2026": { league: 1, season: 2026 },
};

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "INT"]);

function getApiFootballConfig(tournamentSlug: string) {
  const leagueFromEnv = process.env.API_FOOTBALL_LEAGUE_ID;
  const seasonFromEnv = process.env.API_FOOTBALL_SEASON;

  if (leagueFromEnv && seasonFromEnv) {
    const league = Number(leagueFromEnv);
    const season = Number(seasonFromEnv);
    if (Number.isFinite(league) && Number.isFinite(season)) {
      return { league, season };
    }
  }

  return TOURNAMENT_CONFIG[tournamentSlug] ?? null;
}

function parseApiFootballScore(
  fixture: ApiFootballFixture,
): ExternalMatchScore | null {
  const statusShort = fixture.fixture.status.short;
  const homeScore = fixture.goals.home;
  const awayScore = fixture.goals.away;

  if (homeScore == null || awayScore == null) {
    return null;
  }

  if (FINISHED_STATUSES.has(statusShort)) {
    return {
      homeScore,
      awayScore,
      status: "finished",
      source: "api-football",
    };
  }

  if (LIVE_STATUSES.has(statusShort)) {
    return {
      homeScore,
      awayScore,
      status: "live",
      source: "api-football",
    };
  }

  return null;
}

async function fetchFixtures(
  apiKey: string,
  params: Record<string, string>,
): Promise<ApiFootballFixture[]> {
  const url = new URL("https://v3.football.api-sports.io/fixtures");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football (${response.status})`);
  }

  const payload = (await response.json()) as ApiFootballResponse;

  if (payload.errors && Object.keys(payload.errors as object).length > 0) {
    throw new Error(`API-Football: ${JSON.stringify(payload.errors)}`);
  }

  return payload.response ?? [];
}

export async function fetchApiFootballFixtures(
  tournamentSlug: string,
  kickoffDates: string[],
): Promise<ApiFootballFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const config = getApiFootballConfig(tournamentSlug);

  if (!apiKey || !config || kickoffDates.length === 0) {
    return [];
  }

  const uniqueDates = [...new Set(kickoffDates)].sort();
  const fixtures = await fetchFixtures(apiKey, {
    league: String(config.league),
    season: String(config.season),
    from: uniqueDates[0],
    to: uniqueDates[uniqueDates.length - 1],
  });

  const liveFixtures = await fetchFixtures(apiKey, {
    live: String(config.league),
  });

  const byFixtureDate = new Map<string, ApiFootballFixture>();
  for (const fixture of [...fixtures, ...liveFixtures]) {
    byFixtureDate.set(`${fixture.fixture.date}:${fixture.teams.home.name}:${fixture.teams.away.name}`, fixture);
  }

  return [...byFixtureDate.values()];
}

export function findApiFootballScore(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  fixtures: ApiFootballFixture[],
): ExternalMatchScore | null {
  const kickoffMs = new Date(kickoffAt).getTime();

  for (const fixture of fixtures) {
    const homeName = fixture.teams.home.name;
    const awayName = fixture.teams.away.name;

    if (!matchesTeamName(homeTeam, homeName) || !matchesTeamName(awayTeam, awayName)) {
      continue;
    }

    const fixtureMs = new Date(fixture.fixture.date).getTime();
    if (Math.abs(fixtureMs - kickoffMs) > 2 * 60 * 60 * 1000) {
      continue;
    }

    const score = parseApiFootballScore(fixture);
    if (score) {
      return score;
    }
  }

  return null;
}

export function hasApiFootballConfig(tournamentSlug: string): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY && getApiFootballConfig(tournamentSlug));
}
