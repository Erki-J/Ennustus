import { notFound, redirect } from "next/navigation";
import { MatchdayNav } from "@/components/matchday-nav";
import { OverviewPredictionCell } from "@/components/overview/prediction-cell";
import { getProfile } from "@/lib/auth/get-profile";
import { formatDateTime } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";
import type { AppLocale } from "@/lib/settings/locale";
import { translateTeamName } from "@/lib/i18n/teams";
import { getMatchdayOverview } from "@/lib/overview/queries";
import { formatMatchScore } from "@/lib/scoring/calculate";
import { OWN_ROW_CLASS } from "@/lib/ui/highlight";

type OverviewRoundPageProps = {
  params: Promise<{ groupId: string; roundKey: string }>;
};

function matchAbbreviation(home: string, away: string, locale: AppLocale) {
  const homeLabel = translateTeamName(home, locale);
  const awayLabel = translateTeamName(away, locale);
  return `${homeLabel.slice(0, 3).toUpperCase()} ${awayLabel.slice(0, 3).toUpperCase()}`;
}

export default async function OverviewRoundPage({ params }: OverviewRoundPageProps) {
  const { locale, t } = await getI18n();
  const { groupId, roundKey } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const data = await getMatchdayOverview(groupId, roundKey);

  if (!data) {
    notFound();
  }

  const { context, rounds, round, rows, startedMatchIds } = data;

  if (!round) {
    notFound();
  }

  const matches = round.matches;
  const showGroupColumn = matches.some((match) => match.group_code);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="space-y-4 border-b border-zinc-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-zinc-900">
            {t("overview.roundTitle", { round: round.label })}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">{t("overview.activeHint")}</p>
        </div>
        <MatchdayNav
          basePath={`/groups/${groupId}/overview`}
          rounds={rounds}
          currentKey={round.key}
          showBonusTab
          bonusHref={`/groups/${groupId}/overview/bonus`}
        />
      </div>

      <div className="overflow-x-auto border-b border-zinc-100">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">{t("common.date")}</th>
              <th className="px-4 py-2 font-medium">{t("common.home")}</th>
              <th className="px-4 py-2 font-medium">{t("common.away")}</th>
              {showGroupColumn && (
                <th className="px-4 py-2 font-medium">{t("common.group")}</th>
              )}
              <th className="px-4 py-2 font-medium">{t("common.result")}</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-600">
                  {formatDateTime(match.kickoff_at, locale)}
                </td>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  {translateTeamName(match.home_team, locale)}
                </td>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  {translateTeamName(match.away_team, locale)}
                </td>
                {showGroupColumn && (
                  <td className="px-4 py-2 text-zinc-600">
                    {match.group_code
                      ? t("predictionCentre.groupCode", { code: match.group_code })
                      : t("common.dash")}
                  </td>
                )}
                <td className="px-4 py-2 font-medium text-emerald-700">
                  {match.home_score !== null && match.away_score !== null
                    ? formatMatchScore(match.home_score, match.away_score)
                    : t("common.dash")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="sticky left-0 bg-zinc-50 px-3 py-2 font-medium">#</th>
              <th className="sticky left-8 bg-zinc-50 px-3 py-2 font-medium">
                {t("common.name")}
              </th>
              {matches.map((match) => (
                <th
                  key={match.id}
                  className="px-2 py-2 text-center font-medium"
                  title={`${translateTeamName(match.home_team, locale)} – ${translateTeamName(match.away_team, locale)}`}
                >
                  <span className="block">
                    {matchAbbreviation(match.home_team, match.away_team, locale)}
                  </span>
                  {match.home_score !== null && match.away_score !== null && (
                    <span className="mt-0.5 block font-normal text-zinc-400">
                      {formatMatchScore(match.home_score, match.away_score)}
                    </span>
                  )}
                </th>
              ))}
              <th
                className="px-2 py-2 text-center font-medium"
                title={t("overview.pointsTitle")}
              >
                {t("common.points")}
              </th>
              <th className="px-2 py-2 text-center font-medium" title={t("nav.bonus")}>
                {t("common.bonus")}
              </th>
              <th className="px-3 py-2 text-right font-medium">{t("common.total")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.user_id}
                className={`border-t border-zinc-100 ${
                  row.user_id === context.userId ? OWN_ROW_CLASS : ""
                }`}
              >
                <td className="sticky left-0 bg-inherit px-3 py-2">{index + 1}</td>
                <td className="sticky left-8 bg-inherit px-3 py-2 font-medium">
                  {row.nickname}
                </td>
                {row.cells.map((cell, cellIndex) => {
                  const match = matches[cellIndex];
                  const started = startedMatchIds.has(match.id);

                  return (
                    <td key={cellIndex} className="px-2 py-2 text-center">
                      <OverviewPredictionCell cell={cell} matchStarted={started} />
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-semibold text-zinc-900">
                  {row.round_points || "·"}
                </td>
                <td className="px-2 py-2 text-center text-emerald-700">
                  {row.bonus_points || "·"}
                </td>
                <td className="px-3 py-2 text-right font-semibold">{row.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
