import { notFound } from "next/navigation";
import { AdminMatchesResultForm } from "@/components/admin-matches/result-form";
import { MatchdayNav } from "@/components/matchday-nav";
import { getGroupMatchdays } from "@/lib/matchdays/queries";
import { getPredictionCentreMatches } from "@/lib/prediction-centre/queries";

type SettingsMatchesRoundPageProps = {
  params: Promise<{ groupId: string; roundKey: string }>;
};

export default async function SettingsMatchesRoundPage({
  params,
}: SettingsMatchesRoundPageProps) {
  const { groupId, roundKey } = await params;
  const { rounds } = await getGroupMatchdays(groupId);
  const round = rounds.find((item) => item.key === roundKey);

  if (!round) {
    notFound();
  }

  const matches = await getPredictionCentreMatches(groupId, roundKey);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold text-zinc-900">
            Mängude tulemused · {round.label}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Sisesta tegelik skoor — punktid arvutatakse automaatselt uuesti.
          </p>
        </div>
        <MatchdayNav
          basePath={`/groups/${groupId}/settings/matches`}
          rounds={rounds}
          currentKey={round.key}
        />
      </div>
      <div className="mt-4 space-y-3">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">Sellel mängupäeval mänge pole.</p>
        ) : (
          matches.map((match) => (
            <AdminMatchesResultForm key={match.id} groupId={groupId} match={match} />
          ))
        )}
      </div>
    </section>
  );
}
