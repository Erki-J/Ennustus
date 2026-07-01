import { notFound } from "next/navigation";
import { SettingsMemberPredictions } from "@/components/settings/member-predictions";
import {
  getAdminPredictionMatrix,
  loadAdminMemberPredictionsPanel,
} from "@/lib/settings/actions";
import { getI18n } from "@/lib/i18n/server";
import { ADMIN_PREDICTIONS_BONUS_SECTION } from "@/lib/settings/predictions";

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
  const matrix = await getAdminPredictionMatrix(groupId);

  if (!matrix) {
    notFound();
  }

  const { members, rounds } = matrix;

  const initialUserId =
    members.find((member) => member.user_id === player)?.user_id ??
    members[0]?.user_id ??
    "";

  const initialSection =
    section ??
    rounds[0]?.key ??
    ADMIN_PREDICTIONS_BONUS_SECTION;

  const panel =
    initialUserId === ""
      ? null
      : await loadAdminMemberPredictionsPanel(groupId, initialUserId, initialSection);

  if (!panel) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">{t("settings.predictionsTitle")}</h2>
      <p className="mt-1 text-sm text-zinc-600">{t("settings.predictionsHint")}</p>
      <div className="mt-4">
        <SettingsMemberPredictions
          groupId={groupId}
          members={members}
          rounds={rounds.map((item) => ({ key: item.key, label: item.label }))}
          initialUserId={initialUserId}
          initialSection={panel.selectedSection}
          initialMatches={panel.matches}
          initialPredictions={panel.predictions}
          initialBonusPredictions={panel.bonusPredictions}
          initialBonusPoints={panel.bonusPoints}
          initialTeamOptions={panel.teamOptions}
        />
      </div>
    </section>
  );
}
