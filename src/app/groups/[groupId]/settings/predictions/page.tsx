import { notFound } from "next/navigation";
import { SettingsMemberPredictions } from "@/components/settings/member-predictions";
import { getAdminPredictionMatrix } from "@/lib/settings/actions";

type SettingsPredictionsPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function SettingsPredictionsPage({
  params,
  searchParams,
}: SettingsPredictionsPageProps) {
  const { groupId } = await params;
  const { player } = await searchParams;
  const matrix = await getAdminPredictionMatrix(groupId);

  if (!matrix) {
    notFound();
  }

  const { members, matches, predictionMap } = matrix;
  const selectedUserId =
    members.find((member) => member.user_id === player)?.user_id ??
    members[0]?.user_id ??
    null;

  const predictions =
    selectedUserId === null
      ? []
      : matches
          .map((match) => {
            const prediction = predictionMap.get(`${selectedUserId}:${match.id}`);
            if (!prediction) {
              return null;
            }
            return {
              match_id: match.id,
              home_goals: prediction.home_goals,
              away_goals: prediction.away_goals,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Muuda mängijate ennustusi</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Vali mängija ja muuda tema ennustusi. Punktid arvutatakse automaatselt uuesti.
      </p>
      <div className="mt-4">
        <SettingsMemberPredictions
          groupId={groupId}
          members={members}
          matches={matches.map((match) => ({
            id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            kickoff_at: match.kickoff_at,
          }))}
          predictions={predictions}
          selectedUserId={selectedUserId}
        />
      </div>
    </section>
  );
}
