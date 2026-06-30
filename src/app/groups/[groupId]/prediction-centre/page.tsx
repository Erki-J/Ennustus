import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
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
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const { rounds } = await getGroupMatchdays(groupId);

  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="font-semibold text-zinc-900">Ennustuskeskus · Mängud</h2>
        </div>
        <p className="px-6 py-8 text-sm text-zinc-500">
          Selle turniiri mänge pole andmebaasis.
        </p>
      </section>
    );
  }

  const active = getActiveMatchdayRound(rounds);
  redirect(`/groups/${groupId}/prediction-centre/${active.key}`);
}
