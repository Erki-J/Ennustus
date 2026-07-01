import { redirect } from "next/navigation";
import {
  getActiveMatchdayRound,
  getGroupMatchdays,
} from "@/lib/matchdays/queries";

type SettingsMatchesPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsMatchesPage({ params }: SettingsMatchesPageProps) {
  const { groupId } = await params;
  const { rounds } = await getGroupMatchdays(groupId);

  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Mängude tulemused</h2>
        <p className="mt-4 text-sm text-zinc-500">Selle turniiri mänge pole andmebaasis.</p>
      </section>
    );
  }

  const active = getActiveMatchdayRound(rounds);
  redirect(`/groups/${groupId}/settings/matches/${active.key}`);
}
