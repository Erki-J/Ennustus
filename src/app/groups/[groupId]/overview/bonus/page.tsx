import { notFound, redirect } from "next/navigation";
import { MatchdayNav } from "@/components/matchday-nav";
import { abbreviateAnswer, buildQuestionAbbrs } from "@/lib/bonus/abbreviations";
import { getBonusLeaderboard } from "@/lib/bonus/queries";
import { getProfile } from "@/lib/auth/get-profile";
import { OWN_ROW_CLASS } from "@/lib/ui/highlight";
import {
  getActiveMatchdayRound,
  getGroupMatchdays,
} from "@/lib/matchdays/queries";

type OverviewBonusPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function OverviewBonusPage({ params }: OverviewBonusPageProps) {
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const data = await getBonusLeaderboard(groupId);

  if (!data) {
    notFound();
  }

  const { context, locked, questions, rows } = data;
  const { rounds } = await getGroupMatchdays(groupId);
  const activeRound = rounds.length > 0 ? getActiveMatchdayRound(rounds) : null;

  const questionAbbrs = buildQuestionAbbrs(questions);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="space-y-4 border-b border-zinc-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-zinc-900">Ülevaade · Boonus</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Kõigi mängijate boonusennustused — nähtav pärast boonuste lukustamist.
          </p>
        </div>
        {activeRound && (
          <MatchdayNav
            basePath={`/groups/${groupId}/overview`}
            rounds={rounds}
            currentKey={activeRound.key}
            showBonusTab
            bonusHref={`/groups/${groupId}/overview/bonus`}
            bonusActive
          />
        )}
      </div>

      <div className="overflow-x-auto border-b border-zinc-100">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Küsimus</th>
              <th className="px-3 py-2 font-medium">Lühike</th>
              <th className="px-3 py-2 font-medium">Tulemus</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question, index) => (
              <tr key={question.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 text-zinc-800">{question.label}</td>
                <td className="px-3 py-2 font-medium text-zinc-600">
                  {questionAbbrs[index]}
                </td>
                <td className="px-3 py-2 font-medium text-emerald-700">
                  {question.correct_answer ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!locked ? (
        <p className="px-6 py-8 text-sm text-zinc-500">
          Boonuste ülevaade avaneb, kui boonused lukustuvad (esimene mäng algab).
          Seni näed ainult oma boonuseid lehel{" "}
          <span className="font-medium">Ennustuskeskus → Boonus</span>.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="sticky left-0 bg-zinc-50 px-3 py-2 font-medium">#</th>
                <th className="sticky left-8 bg-zinc-50 px-3 py-2 font-medium">Nimi</th>
                {questions.map((question, index) => (
                  <th
                    key={question.id}
                    className="px-2 py-2 text-center font-medium"
                    title={question.label}
                  >
                    {questionAbbrs[index]}
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-medium" title="Mängude punktid">
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
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-2 py-2 text-center ${
                        cell.points > 0
                          ? "font-semibold text-zinc-900"
                          : cell.answer
                            ? "text-zinc-400"
                            : "text-zinc-300"
                      }`}
                    >
                      {cell.answer ? (
                        <>
                          {abbreviateAnswer(cell.answer)}
                          {cell.points > 0 && (
                            <sub className="ml-0.5 font-semibold text-emerald-700">
                              {cell.points}
                            </sub>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center text-zinc-600">
                    {row.match_points}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold text-emerald-700">
                    {row.bonus_points}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {row.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
