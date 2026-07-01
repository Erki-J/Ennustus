import { notFound } from "next/navigation";
import { SettingsBonusAnswerForm } from "@/components/settings/bonus-answers-form";
import { getBonusQuestionsForAdmin } from "@/lib/bonus/queries";
import { getI18n } from "@/lib/i18n/server";

type BonusResultsPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function BonusResultsPage({ params }: BonusResultsPageProps) {
  const { t } = await getI18n();
  const { groupId } = await params;
  const bonusAdmin = await getBonusQuestionsForAdmin(groupId);

  if (!bonusAdmin) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">{t("bonus.resultsTitle")}</h2>
      <p className="mt-1 text-sm text-zinc-600">{t("bonus.resultsHint")}</p>
      {bonusAdmin.questions.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">{t("bonus.noQuestions")}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {bonusAdmin.questions.map((question) => (
            <SettingsBonusAnswerForm
              key={question.id}
              groupId={groupId}
              question={question}
              bonusPoints={bonusAdmin.context.scoring.bonus_points ?? 4}
              teamOptions={bonusAdmin.teamOptions}
            />
          ))}
        </div>
      )}
    </section>
  );
}
