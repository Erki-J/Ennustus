import { matchesTeamName } from "@/lib/cron/scores/team-names";
import { combineKnockoutScore } from "@/lib/scoring/knockout-score";
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
    extratime?: { home: number | null; away: number | null };
    penalty?: { home: number | null; away: number | null };
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

function formatApiFootballError(status: number, errors: unknown): string {
  const errorsText =
    errors && typeof errors === "object"
      ? JSON.stringify(errors)
      : String(errors ?? "");

  if (status === 403 || /suspend|disabled|blocked|banned/i.test(errorsText)) {
    return "API-Football: konto peatatud või võti kehtetu. Taasta konto api-sports.io-s või eemalda API_FOOTBALL_KEY Vercelist.";
  }

  if (status === 429 || /rate limit|requests/i.test(errorsText)) {
    return "API-Football: päringute limiit täis (Free plaan: 100/päev).";
  }

  if (errorsText) {
    return `API-Football: ${errorsText}`;
  }

  return `API-Football (${status})`;
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

function readKicktippFixtureScore(
  fixture: ApiFootballFixture,
): { home: number; away: number } | null {
  const ft = fixture.score?.fulltime;
  const et = fixture.score?.extratime;
  const pen = fixture.score?.penalty;

  let baseHome: number | null = null;
  let baseAway: number | null = null;

  if (et?.home != null && et?.away != null) {
    baseHome = et.home;
    baseAway = et.away;
  } else if (ft?.home != null && ft?.away != null) {
    baseHome = ft.home;
    baseAway = ft.away;
  } else {
    const fallback = readFixtureScore(fixture);
    if (!fallback) {
      return null;
    }
    baseHome = fallback.home;
    baseAway = fallback.away;
  }

  if (pen?.home != null && pen?.away != null) {
    return combineKnockoutScore(
      { home: baseHome, away: baseAway },
      { home: pen.home, away: pen.away },
    );
  }

  return { home: baseHome, away: baseAway };
}

function parseApiFootballScore(
  fixture: ApiFootballFixture,
): ExternalMatchScore | null {
  const statusShort = fixture.fixture.status.short;
  const parsed = readKicktippFixtureScore(fixture);

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

  const payload = (await response.json()) as ApiFootballResponse;

  if (!response.ok) {
    throw new Error(formatApiFootballError(response.status, payload.errors));
  }

  if (payload.errors && Object.keys(payload.errors as object).length > 0) {
    throw new Error(formatApiFootballError(response.status, payload.errors));
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
  const fromDate = uniqueDates[0];
  const toDate = uniqueDates[uniqueDates.length - 1];

  try {
    const fixtures = await fetchFixtures(apiKey, {
      league: String(config.league),
      season: String(config.season),
      from: fromDate,
      to: toDate,
    });

    notes.push(
      `API-Football: 1 päring, ${fixtures.length} mängu (${fromDate}${fromDate === toDate ? "" : `–${toDate}`})`,
    );

    return { fixtures, notes };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tundmatu viga";
    notes.push(message);
    return { fixtures: [], notes };
  }
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
