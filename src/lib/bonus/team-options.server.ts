import { createClient } from "@/lib/supabase/server";
import { sortTeamNames } from "@/lib/i18n/teams";
import type { BonusTeamOptions } from "@/lib/bonus/team-options";
import type { AppLocale } from "@/lib/settings/locale";

export async function fetchBonusTeamOptions(
  tournamentId: string,
  locale: AppLocale = "et",
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
    teamsByGroup[code] = sortTeamNames([...teams], locale);
  }

  return {
    allTeams: sortTeamNames([...allTeamsSet], locale),
    teamsByGroup,
  };
}
