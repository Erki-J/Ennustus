import { notFound, redirect } from "next/navigation";
import { MatchdayNav } from "@/components/matchday-nav";
import { getProfile } from "@/lib/auth/get-profile";
import { getMatchdayOverview } from "@/lib/overview/queries";
import { formatMatchScore } from "@/lib/scoring/calculate";
import { OWN_ROW_CLASS } from "@/lib/ui/highlight";

type OverviewRoundPageProps = {
  params: Promise<{ groupId: string; roundKey: string }>;
};

function matchAbbreviation(home: string, away: string) {
  return `${home.slice(0, 3).toUpperCase()} ${away.slice(0, 3).toUpperCase()}`;
}

function formatKickoff(kickoffAt: string) {
  return new Intl.DateTimeFormat("et-EE", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(kickoffAt));
}

export default async function OverviewRoundPage({ params }: OverviewRoundPageProps) {
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

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="space-y-4 border-b border-zinc-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-zinc-900">Ülevaade · {round.label}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Aktiivne ennustuspäev — vaheta päise nooltega eelmist/järgmist mängupäeva.
          </p>
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
              <th className="px-4 py-2 font-medium">Kuupäev</th>
              <th className="px-4 py-2 font-medium">Kodus</th>
              <th className="px-4 py-2 font-medium">Võõrsil</th>
              <th className="px-4 py-2 font-medium">Grupp</th>
              <th className="px-4 py-2 font-medium">Tulemus</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-600">{formatKickoff(match.kickoff_at)}</td>
                <td className="px-4 py-2 font-medium text-zinc-900">{match.home_team}</td>
                <td className="px-4 py-2 font-medium text-zinc-900">{match.away_team}</td>
                <td className="px-4 py-2 text-zinc-600">
                  {match.group_code ? `Grupp ${match.group_code}` : "—"}
                </td>
                <td className="px-4 py-2 font-medium text-emerald-700">
                  {match.home_score !== null && match.away_score !== null
                    ? formatMatchScore(match.home_score, match.away_score)
                    : "—"}
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
              <th className="sticky left-8 bg-zinc-50 px-3 py-2 font-medium">Nimi</th>
              {matches.map((match) => (
                <th
                  key={match.id}
                  className="px-2 py-2 text-center font-medium"
                  title={`${match.home_team} – ${match.away_team}`}
                >
                  <span className="block">{matchAbbreviation(match.home_team, match.away_team)}</span>
                  {match.home_score !== null && match.away_score !== null && (
                    <span className="mt-0.5 block font-normal text-zinc-400">
                      {formatMatchScore(match.home_score, match.away_score)}
                    </span>
                  )}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium" title="Punktid sellel mängupäeval">
                P
              </th>
              <th className="px-2 py-2 text-center font-medium" title="Boonus">
                B
              </th>
              <th className="px-3 py-2 text-right font-medium">T</th>
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
                  const isOwn = row.user_id === context.userId;
                  const visible = started || isOwn;

                  return (
                    <td key={cellIndex} className="px-2 py-2 text-center">
                      {cell && visible ? (
                        <span>
                          {cell.home_goals}-{cell.away_goals}
                          {started && cell.points > 0 && (
                            <sub className="ml-0.5 font-semibold text-emerald-700">
                              {cell.points}
                            </sub>
                          )}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
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
