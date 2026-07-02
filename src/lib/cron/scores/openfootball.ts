import { englishTeamToEstonian } from "@/lib/cron/scores/team-names";
import type { ExternalMatchScore } from "@/lib/cron/scores/external-score";

export type OpenFootballMatch = {
  homeTeamEn: string;
  awayTeamEn: string;
  homeTeamEt: string;
  awayTeamEt: string;
  kickoffAt: string;
  score: ExternalMatchScore | null;
};

type RawOpenFootballMatch = {
  date?: string;
  time?: string;
  team1?: string;
  team2?: string;
  score?: {
    ft?: [number, number];
    ht?: [number, number];
    et?: [number, number];
    p?: [number, number];
  };
};

const DEFAULT_URLS: Record<string, string> = {
  "wc-2026":
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
};

export function getOpenFootballUrl(tournamentSlug: string): string | null {
  return (
    process.env.OPENFOOTBALL_JSON_URL ??
    DEFAULT_URLS[tournamentSlug] ??
    null
  );
}

export function parseKickoffUtc(date: string, timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]?\d+(?::\d{2})?)?/i);
  if (!match) {
    throw new Error(`Cannot parse kickoff time: ${date} ${timeStr}`);
  }

  const localHours = Number(match[1]);
  const localMinutes = Number(match[2]);
  const offsetRaw = match[3] ?? "0";
  let offsetHours = 0;

  if (offsetRaw.includes(":")) {
    const sign = offsetRaw.startsWith("-") ? -1 : 1;
    const parts = offsetRaw.replace(/^[-+]/, "").split(":");
    offsetHours = sign * (Number(parts[0]) + Number(parts[1] ?? 0) / 60);
  } else {
    offsetHours = Number(offsetRaw);
  }

  const utcTotalMinutes = localHours * 60 + localMinutes - offsetHours * 60;
  const base = new Date(`${date}T00:00:00.000Z`);
  base.setUTCMinutes(base.getUTCMinutes() + utcTotalMinutes);
  return base.toISOString();
}

function parseOpenFootballScore(
  raw: RawOpenFootballMatch,
): ExternalMatchScore | null {
  const score = raw.score;
  if (!score) {
    return null;
  }

  if (score.ft) {
    return {
      homeScore: score.ft[0],
      awayScore: score.ft[1],
      status: "finished",
      source: "openfootball",
    };
  }

  if (score.et) {
    return {
      homeScore: score.et[0],
      awayScore: score.et[1],
      status: "live",
      source: "openfootball",
    };
  }

  if (score.ht) {
    return {
      homeScore: score.ht[0],
      awayScore: score.ht[1],
      status: "live",
      source: "openfootball",
    };
  }

  return null;
}

function parseRawMatch(raw: RawOpenFootballMatch): OpenFootballMatch | null {
  if (!raw.date || !raw.time || !raw.team1 || !raw.team2) {
    return null;
  }

  const homeTeamEn = raw.team1;
  const awayTeamEn = raw.team2;

  return {
    homeTeamEn,
    awayTeamEn,
    homeTeamEt: englishTeamToEstonian(homeTeamEn),
    awayTeamEt: englishTeamToEstonian(awayTeamEn),
    kickoffAt: parseKickoffUtc(raw.date, raw.time),
    score: parseOpenFootballScore(raw),
  };
}

export async function fetchOpenFootballMatches(
  tournamentSlug: string,
): Promise<OpenFootballMatch[]> {
  const url = getOpenFootballUrl(tournamentSlug);
  if (!url) {
    return [];
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`OpenFootball fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as { matches?: RawOpenFootballMatch[] };
  return (payload.matches ?? [])
    .map(parseRawMatch)
    .filter((match): match is OpenFootballMatch => match !== null);
}

export function findOpenFootballScore(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  externalMatches: OpenFootballMatch[],
): ExternalMatchScore | null {
  const kickoffMs = new Date(kickoffAt).getTime();

  const match =
    externalMatches.find((candidate) => {
      if (candidate.homeTeamEt !== homeTeam || candidate.awayTeamEt !== awayTeam) {
        return false;
      }

      const candidateMs = new Date(candidate.kickoffAt).getTime();
      return Math.abs(candidateMs - kickoffMs) <= 60_000;
    }) ?? null;

  return match?.score ?? null;
}
