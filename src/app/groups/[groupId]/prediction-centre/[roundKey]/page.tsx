import { notFound, redirect } from "next/navigation";
import { MatchdayNav } from "@/components/matchday-nav";
import { PredictionCentreMatchRow } from "@/components/prediction-centre/match-row";
import { getProfile } from "@/lib/auth/get-profile";
import { getGroupContext } from "@/lib/groups/context";
import { getGroupMatchdays } from "@/lib/matchdays/queries";
import { getPredictionCentreMatches } from "@/lib/prediction-centre/queries";

type PredictionCentreRoundPageProps = {
  params: Promise<{ groupId: string; roundKey: string }>;
};

export default async function PredictionCentreRoundPage({
  params,
}: PredictionCentreRoundPageProps) {
  const { groupId, roundKey } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const context = await getGroupContext(groupId);

  if (!context) {
    notFound();
  }

  const { rounds } = await getGroupMatchdays(groupId);
  const round = rounds.find((item) => item.key === roundKey);

  if (!round) {
    notFound();
  }

  const matches = await getPredictionCentreMatches(groupId, roundKey);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="space-y-4 border-b border-zinc-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-zinc-900">
            Ennustuskeskus · {round.label}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Ennustus lukustub mängu alguses. Teiste tippe näed ülevaates pärast kickoff&apos;i.
          </p>
        </div>
        <MatchdayNav
          basePath={`/groups/${groupId}/prediction-centre`}
          rounds={rounds}
          currentKey={round.key}
        />
      </div>

      {matches.length === 0 ? (
        <p className="px-6 py-8 text-sm text-zinc-500">
          Sellel mängupäeval mänge pole.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-3 font-medium">Mäng</th>
                <th className="px-3 py-3 font-medium">Sinu ennustus</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <PredictionCentreMatchRow
                  key={match.id}
                  groupId={groupId}
                  match={match}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
