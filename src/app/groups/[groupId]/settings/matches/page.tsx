import { getPredictionCentreMatches } from "@/lib/prediction-centre/queries";
import { AdminMatchesResultForm } from "@/components/admin-matches/result-form";

type SettingsMatchesPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsMatchesPage({ params }: SettingsMatchesPageProps) {
  const { groupId } = await params;
  const matches = await getPredictionCentreMatches(groupId);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Mängude tulemused</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Sisesta tegelik skoor — punktid arvutatakse automaatselt uuesti.
      </p>
      <div className="mt-4 space-y-3">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">Mänge pole lisatud.</p>
        ) : (
          matches.map((match) => (
            <AdminMatchesResultForm key={match.id} groupId={groupId} match={match} />
          ))
        )}
      </div>
    </section>
  );
}
