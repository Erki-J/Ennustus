import { createClient } from "@/lib/supabase/server";
import { getBonusPointsByUser } from "@/lib/bonus/queries";
import { getGroupContext } from "@/lib/groups/context";
import { getLocale } from "@/lib/i18n/server";
import { getGroupMatchdays } from "@/lib/matchdays/queries";
import { OVERVIEW_COLUMN_DEFS } from "@/lib/general-overview/columns";

export type OverviewColumn = {
  key: string;
  header: string;
  matchIds: string[];
};

export type OverviewRow = {
  user_id: string;
  nickname: string;
  round_points: number[];
  bonus_points: number;
  total_points: number;
};

export async function getGeneralOverview(groupId: string) {
  const context = await getGroupContext(groupId);

  if (!context) {
    return { columns: [] as OverviewColumn[], rows: [] as OverviewRow[] };
  }

  const locale = await getLocale();
  const { rounds } = await getGroupMatchdays(groupId, locale);

  const columns: OverviewColumn[] = OVERVIEW_COLUMN_DEFS.map((def) => {
    const round = rounds.find(
      (item) => item.stage === def.stage && item.matchday === def.matchday,
    );
    return {
      key: def.key,
      header: def.header,
      matchIds: round?.matches.map((match) => match.id) ?? [],
    };
  });

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, nickname")
    .eq("group_id", groupId)
    .order("nickname");

  const { data: predictions } = await supabase
    .from("match_predictions")
    .select("user_id, match_id, points")
    .eq("group_id", groupId);

  const pointsMap = new Map<string, number>();
  for (const prediction of predictions ?? []) {
    pointsMap.set(`${prediction.user_id}:${prediction.match_id}`, prediction.points);
  }

  const bonusTotals = await getBonusPointsByUser(groupId);

  const rows: OverviewRow[] = (members ?? []).map((member) => {
    const round_points = columns.map((column) =>
      column.matchIds.reduce(
        (sum, matchId) =>
          sum + (pointsMap.get(`${member.user_id}:${matchId}`) ?? 0),
        0,
      ),
    );

    const matchTotal = (predictions ?? [])
      .filter((prediction) => prediction.user_id === member.user_id)
      .reduce((sum, prediction) => sum + prediction.points, 0);

    const bonus_points = bonusTotals.get(member.user_id) ?? 0;

    return {
      user_id: member.user_id,
      nickname: member.nickname,
      round_points,
      bonus_points,
      total_points: matchTotal + bonus_points,
    };
  });

  rows.sort((a, b) => b.total_points - a.total_points);

  return { columns, rows };
}
