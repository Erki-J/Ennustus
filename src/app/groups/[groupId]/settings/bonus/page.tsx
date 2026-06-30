import { notFound } from "next/navigation";
import { SettingsBonusAnswerForm } from "@/components/settings/bonus-answers-form";
import { getBonusQuestionsForAdmin } from "@/lib/bonus/queries";

type SettingsBonusPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsBonusPage({ params }: SettingsBonusPageProps) {
  const { groupId } = await params;
  const bonusAdmin = await getBonusQuestionsForAdmin(groupId);

  if (!bonusAdmin) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Boonuse tulemused</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Sisesta õige vastus — punktid arvutatakse automaatselt uuesti.
      </p>
      {bonusAdmin.questions.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Boonusküsimusi pole.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {bonusAdmin.questions.map((question) => (
            <SettingsBonusAnswerForm
              key={question.id}
              groupId={groupId}
              question={question}
              bonusPoints={bonusAdmin.context.scoring.bonus_points ?? 4}
            />
          ))}
        </div>
      )}
    </section>
  );
}
