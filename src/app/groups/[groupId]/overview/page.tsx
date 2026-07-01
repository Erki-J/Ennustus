import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { getI18n } from "@/lib/i18n/server";
import {
  getActiveMatchdayRound,
  getGroupMatchdays,
} from "@/lib/matchdays/queries";

type OverviewIndexPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function OverviewIndexPage({ params }: OverviewIndexPageProps) {
  const { locale, t } = await getI18n();
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const { rounds } = await getGroupMatchdays(groupId, locale);

  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">{t("overview.title")}</h2>
        <p className="mt-4 text-sm text-zinc-500">{t("overview.noMatches")}</p>
      </section>
    );
  }

  const active = getActiveMatchdayRound(rounds);
  redirect(`/groups/${groupId}/overview/${active.key}`);
}
