import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import {
  getActiveMatchdayRound,
  getGroupMatchdays,
} from "@/lib/matchdays/queries";

type OverviewIndexPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function OverviewIndexPage({ params }: OverviewIndexPageProps) {
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const { rounds } = await getGroupMatchdays(groupId);

  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Ülevaade</h2>
        <p className="mt-4 text-sm text-zinc-500">Mänge pole veel lisatud.</p>
      </section>
    );
  }

  const active = getActiveMatchdayRound(rounds);
  redirect(`/groups/${groupId}/overview/${active.key}`);
}
