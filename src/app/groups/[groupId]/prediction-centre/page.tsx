import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { getI18n } from "@/lib/i18n/server";
import {
  getActiveMatchdayRound,
  getGroupMatchdays,
} from "@/lib/matchdays/queries";

type PredictionCentreIndexProps = {
  params: Promise<{ groupId: string }>;
};

export default async function PredictionCentreIndexPage({
  params,
}: PredictionCentreIndexProps) {
  const { locale, t } = await getI18n();
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const { rounds } = await getGroupMatchdays(groupId, locale);

  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="font-semibold text-zinc-900">{t("predictionCentre.title")}</h2>
        </div>
        <p className="px-6 py-8 text-sm text-zinc-500">{t("predictionCentre.noMatches")}</p>
      </section>
    );
  }

  const active = getActiveMatchdayRound(rounds);
  redirect(`/groups/${groupId}/prediction-centre/${active.key}`);
}
