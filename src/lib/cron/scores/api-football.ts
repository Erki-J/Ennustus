import { matchesTeamName } from "@/lib/cron/scores/team-names";
import type { ExternalMatchScore } from "@/lib/cron/scores/external-score";

export type ApiFootballFixture = {
  fixture: {
    date: string;
    status: {
      short: string;
    };
  };
  league?: {
    id: number;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
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

export type ApiFootballFetchResult = {
  fixtures: ApiFootballFixture[];
  notes: string[];
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

function readFixtureScore(
  fixture: ApiFootballFixture,
): { home: number; away: number } | null {
  const home =
    fixture.goals.home ??
    fixture.score?.fulltime?.home ??
    fixture.score?.halftime?.home;
  const away =
    fixture.goals.away ??
    fixture.score?.fulltime?.away ??
    fixture.score?.halftime?.away;

  if (home == null || away == null) {
    return null;
  }

  return { home, away };
}

function parseApiFootballScore(
  fixture: ApiFootballFixture,
): ExternalMatchScore | null {
  const statusShort = fixture.fixture.status.short;
  const parsed = readFixtureScore(fixture);

  if (FINISHED_STATUSES.has(statusShort)) {
    if (!parsed) {
      return null;
    }

    return {
      homeScore: parsed.home,
      awayScore: parsed.away,
      status: "finished",
      source: "api-football",
    };
  }

  if (LIVE_STATUSES.has(statusShort)) {
    return {
      homeScore: parsed?.home ?? 0,
      awayScore: parsed?.away ?? 0,
      status: "live",
      source: "api-football",
    };
  }

  return null;
}

function fixtureKey(fixture: ApiFootballFixture): string {
  return `${fixture.fixture.date}:${fixture.teams.home.name}:${fixture.teams.away.name}`;
}

function mergeFixtures(
  target: Map<string, ApiFootballFixture>,
  fixtures: ApiFootballFixture[],
) {
  for (const fixture of fixtures) {
    target.set(fixtureKey(fixture), fixture);
  }
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

function kickoffMatchesFixture(kickoffAt: string, fixtureDate: string): boolean {
  const kickoffMs = new Date(kickoffAt).getTime();
  const fixtureMs = new Date(fixtureDate).getTime();

  if (Math.abs(fixtureMs - kickoffMs) <= 3 * 60 * 60 * 1000) {
    return true;
  }

  return kickoffAt.slice(0, 10) === fixtureDate.slice(0, 10);
}

export async function fetchApiFootballFixtures(
  tournamentSlug: string,
  kickoffDates: string[],
): Promise<ApiFootballFetchResult> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const config = getApiFootballConfig(tournamentSlug);
  const notes: string[] = [];

  if (!apiKey || !config || kickoffDates.length === 0) {
    return { fixtures: [], notes };
  }

  const uniqueDates = [...new Set(kickoffDates)].sort();
  const byFixtureDate = new Map<string, ApiFootballFixture>();

  try {
    const rangeFixtures = await fetchFixtures(apiKey, {
      league: String(config.league),
      season: String(config.season),
      from: uniqueDates[0],
      to: uniqueDates[uniqueDates.length - 1],
    });
    mergeFixtures(byFixtureDate, rangeFixtures);
    notes.push(
      `API-Football: ${rangeFixtures.length} mängu (${uniqueDates[0]}–${uniqueDates.at(-1)})`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tundmatu viga";
    notes.push(message);
  }

  for (const date of uniqueDates) {
    try {
      const dateFixtures = await fetchFixtures(apiKey, {
        league: String(config.league),
        season: String(config.season),
        date,
      });
      mergeFixtures(byFixtureDate, dateFixtures);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tundmatu viga";
      notes.push(`${date}: ${message}`);
    }
  }

  try {
    const liveFixtures = await fetchFixtures(apiKey, {
      live: "all",
    });
    const tournamentLive = liveFixtures.filter(
      (fixture) => fixture.league?.id === config.league,
    );
    mergeFixtures(byFixtureDate, tournamentLive);
    notes.push(`API-Football live: ${tournamentLive.length} mängu`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tundmatu viga";
    notes.push(`Live: ${message}`);
  }

  return {
    fixtures: [...byFixtureDate.values()],
    notes,
  };
}

export function findApiFootballScore(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  fixtures: ApiFootballFixture[],
): ExternalMatchScore | null {
  for (const fixture of fixtures) {
    const homeName = fixture.teams.home.name;
    const awayName = fixture.teams.away.name;

    if (!matchesTeamName(homeTeam, homeName) || !matchesTeamName(awayTeam, awayName)) {
      continue;
    }

    if (!kickoffMatchesFixture(kickoffAt, fixture.fixture.date)) {
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
