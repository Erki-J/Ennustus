import { matchesTeamName } from "@/lib/cron/scores/team-names";
import { combineKnockoutScore } from "@/lib/scoring/knockout-score";
import type { ExternalMatchScore } from "@/lib/cron/scores/external-score";

type FootballDataTeam = {
  name?: string;
  shortName?: string;
};

export type FootballDataMatch = {
  utcDate?: string;
  status?: string;
  homeTeam?: { name?: string; shortName?: string };
  awayTeam?: { name?: string; shortName?: string };
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
    extraTime?: { home?: number | null; away?: number | null };
    penalties?: { home?: number | null; away?: number | null };
  };
};

type FootballDataResponse = {
  matches?: FootballDataMatch[];
};

const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE"]);
const FINISHED_STATUSES = new Set(["FINISHED", "AWARDED"]);

function readKicktippFootballDataScore(
  match: FootballDataMatch,
): { home: number; away: number } | null {
  const fullTime = match.score?.fullTime;
  const extraTime = match.score?.extraTime;
  const penalties = match.score?.penalties;

  let baseHome: number | null = null;
  let baseAway: number | null = null;

  if (extraTime?.home != null && extraTime?.away != null) {
    baseHome = extraTime.home;
    baseAway = extraTime.away;
  } else if (fullTime?.home != null && fullTime?.away != null) {
    baseHome = fullTime.home;
    baseAway = fullTime.away;
  } else {
    return null;
  }

  if (penalties?.home != null && penalties?.away != null) {
    return combineKnockoutScore(
      { home: baseHome, away: baseAway },
      { home: penalties.home, away: penalties.away },
    );
  }

  return { home: baseHome, away: baseAway };
}

function parseFootballDataScore(match: FootballDataMatch): ExternalMatchScore | null {
  const status = match.status ?? "";
  const fullTime = match.score?.fullTime;
  const halfTime = match.score?.halfTime;

  if (FINISHED_STATUSES.has(status)) {
    const parsed = readKicktippFootballDataScore(match);
    if (!parsed) {
      return null;
    }

    return {
      homeScore: parsed.home,
      awayScore: parsed.away,
      status: "finished",
      source: "football-data",
    };
  }

  if (LIVE_STATUSES.has(status)) {
    const homeScore = fullTime?.home ?? halfTime?.home;
    const awayScore = fullTime?.away ?? halfTime?.away;

    if (homeScore == null || awayScore == null) {
      return null;
    }

    return {
      homeScore,
      awayScore,
      status: "live",
      source: "football-data",
    };
  }

  return null;
}

function teamLabel(team: FootballDataTeam | undefined): string {
  return team?.shortName ?? team?.name ?? "";
}

export async function fetchFootballDataScores(
  kickoffDates: string[],
): Promise<FootballDataMatch[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey || kickoffDates.length === 0) {
    return [];
  }

  const uniqueDates = [...new Set(kickoffDates)].sort();
  const dateFrom = uniqueDates[0];
  const dateTo = uniqueDates[uniqueDates.length - 1];
  const url = new URL("https://api.football-data.org/v4/matches");
  url.searchParams.set("dateFrom", dateFrom);
  url.searchParams.set("dateTo", dateTo);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Auth-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`football-data.org (${response.status})`);
  }

  const payload = (await response.json()) as FootballDataResponse;
  return payload.matches ?? [];
}

export function findFootballDataScore(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  matches: FootballDataMatch[],
): ExternalMatchScore | null {
  const kickoffMs = new Date(kickoffAt).getTime();

  for (const match of matches) {
    if (!match.utcDate) {
      continue;
    }

    const homeLabel = teamLabel(match.homeTeam);
    const awayLabel = teamLabel(match.awayTeam);
    if (!matchesTeamName(homeTeam, homeLabel) || !matchesTeamName(awayTeam, awayLabel)) {
      continue;
    }

    const matchMs = new Date(match.utcDate).getTime();
    if (Math.abs(matchMs - kickoffMs) > 2 * 60 * 60 * 1000) {
      continue;
    }

    const score = parseFootballDataScore(match);
    if (score) {
      return score;
    }
  }

  return null;
}
