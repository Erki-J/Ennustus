import { notFound } from "next/navigation";
import { SettingsCronForm } from "@/components/settings/cron-form";
import { SettingsCronSyncButton } from "@/components/settings/cron-sync-button";
import { getGroupCronPageData } from "@/lib/settings/actions";
import { formatDateTime } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

type SettingsCronPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsCronPage({ params }: SettingsCronPageProps) {
  const { locale, t } = await getI18n();
  const { groupId } = await params;
  const data = await getGroupCronPageData(groupId);

  if (!data) {
    notFound();
  }

  const { cron, status } = data;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">{t("settings.cronTitle")}</h2>
      <p className="mt-1 text-sm text-zinc-600">{t("settings.cronHint")}</p>

      <dl className="mt-4 grid gap-3 rounded-lg bg-zinc-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500">{t("settings.status")}</dt>
          <dd className="font-medium text-zinc-900">
            {cron.enabled ? t("common.on") : t("common.off")}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("settings.matchesInWindow")}</dt>
          <dd className="font-medium text-zinc-900">{status.activeCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("settings.lastRun")}</dt>
          <dd className="font-medium text-zinc-900">
            {cron.last_run_at
              ? formatDateTime(cron.last_run_at, locale)
              : t("settings.neverRun")}
          </dd>
        </div>
      </dl>

      {cron.enabled && status.activeCount > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("settings.windowActive")}
        </p>
      )}

      {cron.enabled && status.activeCount === 0 && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {t("settings.windowInactive")}
        </p>
      )}

      <div className="mt-4">
        <SettingsCronForm groupId={groupId} cron={cron} />
        <SettingsCronSyncButton groupId={groupId} />
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">{t("settings.vercelSetup")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t("settings.vercelEnvHint")}</li>
          <li>{t("settings.vercelHobbyHint")}</li>
          <li>{t("settings.vercelIntervalHint")}</li>
          <li>{t("settings.scoreImportHint")}</li>
        </ul>
      </div>
    </section>
  );
}
