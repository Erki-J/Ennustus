import { notFound, redirect } from "next/navigation";
import { BonusForm } from "@/components/bonus/bonus-form";
import { getProfile } from "@/lib/auth/get-profile";
import { getBonusCentre } from "@/lib/bonus/queries";

type PredictionCentreBonusPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function PredictionCentreBonusPage({
  params,
}: PredictionCentreBonusPageProps) {
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
        <p className="px-6 py-8 text-sm text-zinc-500">
          Boonusküsimused puuduvad. Käivita Supabase SQL Editoris fail{" "}
          <code className="rounded bg-zinc-100 px-1">migration-004-bonus.sql</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 border-b border-zinc-100 pb-4">
        <h2 className="font-semibold text-zinc-900">Ennustuskeskus · Boonus</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Täida enne turniiri algust. Lukustub, kui esimene mäng algab.
        </p>
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
