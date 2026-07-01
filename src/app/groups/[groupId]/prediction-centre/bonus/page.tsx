import { notFound, redirect } from "next/navigation";
import { BonusForm } from "@/components/bonus/bonus-form";
import { getProfile } from "@/lib/auth/get-profile";
import { getBonusCentre } from "@/lib/bonus/queries";
import { getI18n } from "@/lib/i18n/server";

type PredictionCentreBonusPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function PredictionCentreBonusPage({
  params,
}: PredictionCentreBonusPageProps) {
  const { t } = await getI18n();
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const bonus = await getBonusCentre(groupId);

  if (!bonus) {
    notFound();
  }

  const {
    locked,
    teamOptions,
    groupWinners,
    tournamentWinner,
    topScorer,
    semifinalists,
  } = bonus;

  if (groupWinners.length === 0 && !tournamentWinner) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="px-6 py-8 text-sm text-zinc-500">{t("predictionCentre.noBonusQuestions")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 border-b border-zinc-100 pb-4">
        <h2 className="font-semibold text-zinc-900">{t("predictionCentre.bonusTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("predictionCentre.bonusHint")}</p>
      </div>

      <BonusForm
        groupId={groupId}
        locked={locked}
        bonusPoints={bonus.context.scoring.bonus_points ?? 4}
        teamOptions={teamOptions}
        groupWinners={groupWinners}
        tournamentWinner={tournamentWinner}
        topScorer={topScorer}
        semifinalists={semifinalists}
      />
    </section>
  );
}
