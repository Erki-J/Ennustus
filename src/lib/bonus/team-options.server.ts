import { createClient } from "@/lib/supabase/server";
import type { BonusTeamOptions } from "@/lib/bonus/team-options";

function sortTeams(teams: Iterable<string>): string[] {
  return [...teams].sort((a, b) => a.localeCompare(b, "et"));
}

export async function fetchBonusTeamOptions(
  tournamentId: string,
): Promise<BonusTeamOptions> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("home_team, away_team, group_code")
    .eq("tournament_id", tournamentId)
    .eq("stage", "group");

  const teamsByGroupSets: Record<string, Set<string>> = {};
  const allTeamsSet = new Set<string>();

  for (const match of matches ?? []) {
    if (!match.group_code) {
      continue;
    }

    if (!teamsByGroupSets[match.group_code]) {
      teamsByGroupSets[match.group_code] = new Set();
    }

    teamsByGroupSets[match.group_code].add(match.home_team);
    teamsByGroupSets[match.group_code].add(match.away_team);
    allTeamsSet.add(match.home_team);
    allTeamsSet.add(match.away_team);
  }

  const teamsByGroup: Record<string, string[]> = {};
  for (const [code, teams] of Object.entries(teamsByGroupSets)) {
    teamsByGroup[code] = sortTeams(teams);
  }

  return {
    allTeams: sortTeams(allTeamsSet),
    teamsByGroup,
  };
}
