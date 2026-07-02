import type { Match } from "@/types/database";

type TeamStats = {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

function emptyStats(team: string): TeamStats {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function applyFinishedMatches(stats: Map<string, TeamStats>, matches: Match[]) {
  for (const match of matches) {
    if (
      match.status !== "finished" ||
      match.home_score == null ||
      match.away_score == null
    ) {
      continue;
    }

    const home = stats.get(match.home_team);
    const away = stats.get(match.away_team);
    if (!home || !away) {
      continue;
    }

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;
    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.home_score < match.away_score) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }
}

function compareTeamStats(a: TeamStats, b: TeamStats): number {
  if (b.points !== a.points) {
    return b.points - a.points;
  }

  const gdA = a.goalsFor - a.goalsAgainst;
  const gdB = b.goalsFor - b.goalsAgainst;
  if (gdB !== gdA) {
    return gdB - gdA;
  }

  if (b.goalsFor !== a.goalsFor) {
    return b.goalsFor - a.goalsFor;
  }

  return 0;
}

function rankTeams(teams: TeamStats[], matches: Match[]): TeamStats[] {
  const sorted = [...teams].sort(compareTeamStats);
  const top = sorted[0];
  if (!top) {
    return sorted;
  }

  const tiedAtTop = sorted.filter(
    (team) =>
      team.points === top.points &&
      team.goalsFor - team.goalsAgainst === top.goalsFor - top.goalsAgainst &&
      team.goalsFor === top.goalsFor,
  );

  if (tiedAtTop.length <= 1) {
    return sorted;
  }

  const teamSet = new Set(tiedAtTop.map((team) => team.team));
  const h2hMatches = matches.filter(
    (match) =>
      match.status === "finished" &&
      teamSet.has(match.home_team) &&
      teamSet.has(match.away_team),
  );
  const h2hStats = new Map<string, TeamStats>();
  for (const team of tiedAtTop) {
    h2hStats.set(team.team, emptyStats(team.team));
  }
  applyFinishedMatches(h2hStats, h2hMatches);

  const h2hRanked = [...h2hStats.values()].sort((a, b) => {
    const cmp = compareTeamStats(a, b);
    return cmp !== 0 ? cmp : a.team.localeCompare(b.team, "et");
  });

  const rest = sorted.filter((team) => !teamSet.has(team.team));
  return [...h2hRanked, ...rest];
}

export function computeGroupWinner(groupMatches: Match[]): string | null {
  if (groupMatches.length === 0) {
    return null;
  }

  const allFinished = groupMatches.every(
    (match) =>
      match.status === "finished" &&
      match.home_score != null &&
      match.away_score != null,
  );
  if (!allFinished) {
    return null;
  }

  const teams = new Set<string>();
  for (const match of groupMatches) {
    teams.add(match.home_team);
    teams.add(match.away_team);
  }

  const stats = new Map<string, TeamStats>();
  for (const team of teams) {
    stats.set(team, emptyStats(team));
  }
  applyFinishedMatches(stats, groupMatches);

  const ranked = rankTeams([...stats.values()], groupMatches);
  return ranked[0]?.team ?? null;
}

export function isTournamentFinished(matches: Match[]): boolean {
  return matches.some(
    (match) => match.stage === "final" && match.status === "finished",
  );
}

export function computeTournamentWinner(matches: Match[]): string | null {
  const finals = matches
    .filter(
      (match) =>
        match.stage === "final" &&
        match.status === "finished" &&
        match.home_score != null &&
        match.away_score != null,
    )
    .sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    );

  const final = finals[0];
  if (!final || final.home_score == null || final.away_score == null) {
    return null;
  }

  if (final.home_score > final.away_score) {
    return final.home_team;
  }
  if (final.away_score > final.home_score) {
    return final.away_team;
  }

  return null;
}

export function computeTopScoringTeam(matches: Match[]): string | null {
  if (!isTournamentFinished(matches)) {
    return null;
  }

  const totals = new Map<string, number>();

  for (const match of matches) {
    if (
      match.status !== "finished" ||
      match.home_score == null ||
      match.away_score == null
    ) {
      continue;
    }

    totals.set(match.home_team, (totals.get(match.home_team) ?? 0) + match.home_score);
    totals.set(match.away_team, (totals.get(match.away_team) ?? 0) + match.away_score);
  }

  let topTeam: string | null = null;
  let topGoals = -1;

  for (const [team, goals] of totals) {
    if (goals > topGoals) {
      topGoals = goals;
      topTeam = team;
    } else if (goals === topGoals && topTeam && team.localeCompare(topTeam, "et") < 0) {
      topTeam = team;
    }
  }

  return topTeam;
}
