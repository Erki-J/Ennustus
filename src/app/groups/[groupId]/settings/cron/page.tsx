import { notFound } from "next/navigation";
import { SettingsCronForm } from "@/components/settings/cron-form";
import { getGroupCronPageData } from "@/lib/settings/actions";

type SettingsCronPageProps = {
  params: Promise<{ groupId: string }>;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Pole veel käivitatud";
  }

  return new Intl.DateTimeFormat("et-EE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SettingsCronPage({ params }: SettingsCronPageProps) {
  const { groupId } = await params;
  const data = await getGroupCronPageData(groupId);

  if (!data) {
    notFound();
  }

  const { cron, status } = data;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Cron</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Automaatne tulemuste kontroll ainult mängu aknas: alates kickoff&apos;ist kuni
        eeldatava mängu lõpu + lisanihe. Väljaspool seda akent päringuid ei tehta.
      </p>

      <dl className="mt-4 grid gap-3 rounded-lg bg-zinc-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500">Staatus</dt>
          <dd className="font-medium text-zinc-900">
            {cron.enabled ? "Sees" : "Väljas"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Mänge aknas praegu</dt>
          <dd className="font-medium text-zinc-900">{status.activeCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Viimane käivitus</dt>
          <dd className="font-medium text-zinc-900">{formatTimestamp(cron.last_run_at)}</dd>
        </div>
      </dl>

      {cron.enabled && status.activeCount > 0 && !status.nextEligible && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Mängu aken on aktiivne, aga intervall ({cron.interval_minutes} min) pole veel
          täis — järgmine päring tehakse hiljem.
        </p>
      )}

      {cron.enabled && status.activeCount === 0 && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Praegu pole ühtegi mängu päringu aknas — cron ei tee päringuid.
        </p>
      )}

      <div className="mt-4">
        <SettingsCronForm groupId={groupId} cron={cron} />
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">Vercel seadistus</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Lisa keskkonna muutujad: <code>CRON_SECRET</code>,{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>
          </li>
          <li>
            Vercel Hobby lubab cron&apos;i <strong>1× päevas</strong> (
            <code>0 7 * * *</code> — iga päev ~07:00 UTC). Tihedamaks pärimiseks
            (nt iga 5 min mängu ajal) kasuta välist schedulerit, mis kutsub{" "}
            <code>/api/cron/sync-results</code> päisega{" "}
            <code>Authorization: Bearer CRON_SECRET</code>.
          </li>
          <li>
            Siin seatud intervall kehtib iga päringu kohta — cron ei tee päringuid
            väljaspool mängu akent.
          </li>
          <li>
            Skooride automaatne import vajab eraldi API võtit (
            <code>FOOTBALL_DATA_API_KEY</code>) — praegu uuendatakse peamiselt mängu
            staatust (scheduled → live).
          </li>
        </ul>
      </div>
    </section>
  );
}
