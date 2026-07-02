import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getI18n();
  const profile = await requirePlatformAdmin();

  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 hover:underline"
          >
            {t("common.backToDashboard")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
            {t("platformAdmin.title")}
          </h1>
          <p className="mt-1 text-zinc-600">{t("platformAdmin.subtitle")}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
