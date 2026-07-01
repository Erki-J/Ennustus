import { notFound } from "next/navigation";
import { SettingsMemberPredictions } from "@/components/settings/member-predictions";
import {
  getAdminBonusPanelsForGroup,
  getAdminPredictionMatrix,
} from "@/lib/settings/actions";
import { getI18n } from "@/lib/i18n/server";
import {
  ADMIN_PREDICTIONS_BONUS_SECTION,
  buildAdminMatchPredictionsPanel,
  serializeAdminPredictionMap,
} from "@/lib/settings/predictions";

type SettingsPredictionsPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ player?: string; section?: string }>;
};

export default async function SettingsPredictionsPage({
  params,
  searchParams,
}: SettingsPredictionsPageProps) {
  const { t } = await getI18n();
  const { groupId } = await params;
  const { player, section } = await searchParams;

  const [matrix, bonusPanels] = await Promise.all([
    getAdminPredictionMatrix(groupId),
    getAdminBonusPanelsForGroup(groupId),
  ]);

  if (!matrix || !bonusPanels) {
    notFound();
  }

  const { members, rounds, predictionMap } = matrix;

  const initialUserId =
    members.find((member) => member.user_id === player)?.user_id ??
    members[0]?.user_id ??
    "";

  if (initialUserId === "") {
    notFound();
  }

  const initialSection =
    section ??
    rounds[0]?.key ??
    ADMIN_PREDICTIONS_BONUS_SECTION;

  const serializedPredictionMap = serializeAdminPredictionMap(predictionMap);
  const roundsWithMatches = rounds.map((round) => ({
    key: round.key,
    label: round.label,
    matches: round.matches.map((match) => ({
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
      kickoff_at: match.kickoff_at,
    })),
  }));

  const isBonusSection = initialSection === ADMIN_PREDICTIONS_BONUS_SECTION;
  const initialMatchPanel = buildAdminMatchPredictionsPanel(
    initialUserId,
    initialSection,
    roundsWithMatches,
    serializedPredictionMap,
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">{t("settings.predictionsTitle")}</h2>
      <p className="mt-1 text-sm text-zinc-600">{t("settings.predictionsHint")}</p>
      <div className="mt-4">
        <SettingsMemberPredictions
          groupId={groupId}
          members={members}
          rounds={rounds.map((item) => ({ key: item.key, label: item.label }))}
          roundsWithMatches={roundsWithMatches}
          predictionMap={serializedPredictionMap}
          bonusPanelsByUser={bonusPanels.byUser}
          initialUserId={initialUserId}
          initialSection={
            isBonusSection ? ADMIN_PREDICTIONS_BONUS_SECTION : initialMatchPanel.selectedSection
          }
        />
      </div>
    </section>
  );
}
