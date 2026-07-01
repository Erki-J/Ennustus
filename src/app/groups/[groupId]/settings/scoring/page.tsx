import { notFound } from "next/navigation";
import { SettingsScoringForm } from "@/components/settings/scoring-form";
import { getAdminPredictionMatrix } from "@/lib/settings/actions";

type SettingsScoringPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsScoringPage({ params }: SettingsScoringPageProps) {
  const { groupId } = await params;
  const matrix = await getAdminPredictionMatrix(groupId);

  if (!matrix) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Punktireeglid</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Vaikimisi 4 / 3 / 2 / 2 / 4 — täpne skoor / väravate vahe / võitja / viik /
        boonus. Viigi punktid kehtivad siis, kui nii tegelik tulemus kui ka ennustus
        on viigid, aga skoor erineb (nt tegelik 1:1, ennustus 2:2). Kui tegelik on
        viik aga ennustati võitjat, punkte ei saa.
      </p>
      <div className="mt-4">
        <SettingsScoringForm groupId={groupId} scoring={matrix.context.scoring} />
      </div>
    </section>
  );
}
