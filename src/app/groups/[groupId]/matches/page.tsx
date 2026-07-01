import { redirect } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import {
  getActiveMatchdayRound,
  getGroupMatchdays,
} from "@/lib/matchdays/queries";

type MatchesPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function MatchesPage({ params }: MatchesPageProps) {
  const { locale, t } = await getI18n();
  const { groupId } = await params;
  const { rounds } = await getGroupMatchdays(groupId, locale);

  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">{t("admin.matchesTitle")}</h2>
        <p className="mt-4 text-sm text-zinc-500">{t("admin.noMatches")}</p>
      </section>
    );
  }

  const active = getActiveMatchdayRound(rounds);
  redirect(`/groups/${groupId}/matches/${active.key}`);
}
