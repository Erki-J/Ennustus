import { notFound } from "next/navigation";
import {
  ADMIN_PREDICTIONS_BONUS_SECTION,
  SettingsMemberPredictions,
} from "@/components/settings/member-predictions";
import {
  getAdminMemberBonus,
  getAdminPredictionMatrix,
} from "@/lib/settings/actions";

type SettingsPredictionsPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ player?: string; section?: string }>;
};

export default async function SettingsPredictionsPage({
  params,
  searchParams,
}: SettingsPredictionsPageProps) {
  const { groupId } = await params;
  const { player, section } = await searchParams;
  const isBonusSection = section === ADMIN_PREDICTIONS_BONUS_SECTION;
  const matrix = await getAdminPredictionMatrix(
    groupId,
    isBonusSection ? undefined : section,
  );

  if (!matrix) {
    notFound();
  }

  const { members, rounds, round, matches, predictionMap, context } = matrix;

  const selectedUserId =
    members.find((member) => member.user_id === player)?.user_id ??
    members[0]?.user_id ??
    null;

  const selectedSection = isBonusSection
    ? ADMIN_PREDICTIONS_BONUS_SECTION
    : (round?.key ?? rounds[0]?.key ?? ADMIN_PREDICTIONS_BONUS_SECTION);

  const predictions =
    selectedUserId === null
      ? []
      : matches.map((match) => {
          const prediction = predictionMap.get(`${selectedUserId}:${match.id}`);
          return {
            match_id: match.id,
            home_goals: prediction?.home_goals ?? 0,
            away_goals: prediction?.away_goals ?? 0,
          };
        });

  const bonusData =
    selectedUserId && isBonusSection
      ? await getAdminMemberBonus(groupId, selectedUserId)
      : null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Muuda mängijate ennustusi</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Vali mängija ja jaotus (mängupäev või boonus). Punktid arvutatakse
        automaatselt uuesti.
      </p>
      <div className="mt-4">
        <SettingsMemberPredictions
          groupId={groupId}
          members={members}
          rounds={rounds.map((item) => ({ key: item.key, label: item.label }))}
          selectedSection={selectedSection}
          matches={matches.map((match) => ({
            id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            kickoff_at: match.kickoff_at,
          }))}
          predictions={predictions}
          bonusPredictions={bonusData?.questions ?? []}
          bonusPoints={bonusData?.bonusPoints ?? context.scoring.bonus_points}
          teamOptions={bonusData?.teamOptions ?? { allTeams: [], teamsByGroup: {} }}
          selectedUserId={selectedUserId}
        />
      </div>
    </section>
  );
}
