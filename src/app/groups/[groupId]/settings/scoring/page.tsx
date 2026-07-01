import { notFound } from "next/navigation";
import { SettingsScoringForm } from "@/components/settings/scoring-form";
import { getAdminPredictionMatrix } from "@/lib/settings/actions";
import { getI18n } from "@/lib/i18n/server";

type SettingsScoringPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsScoringPage({ params }: SettingsScoringPageProps) {
  const { t } = await getI18n();
  const { groupId } = await params;
  const matrix = await getAdminPredictionMatrix(groupId);

  if (!matrix) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">{t("settings.scoringTitle")}</h2>
      <p className="mt-1 text-sm text-zinc-600">{t("settings.scoringHint")}</p>
      <div className="mt-4">
        <SettingsScoringForm groupId={groupId} scoring={matrix.context.scoring} />
      </div>
    </section>
  );
}
