import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { CreateGroupForm } from "@/components/create-group-form";
import { getProfile } from "@/lib/auth/get-profile";
import { getActiveTournaments } from "@/lib/groups/queries";
import { getI18n } from "@/lib/i18n/server";

export default async function NewGroupPage() {
  const { t } = await getI18n();
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const tournaments = await getActiveTournaments();

  if (tournaments.length === 0) {
    return (
      <div className="min-h-full bg-zinc-50">
        <AppHeader profile={profile} />
        <main className="mx-auto max-w-lg px-4 py-8">
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            {t("group.noTournaments")}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 hover:underline"
          >
            {t("common.back")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
            {t("group.createGroupTitle")}
          </h1>
          <p className="mt-1 text-zinc-600">{t("group.createGroupSubtitle")}</p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CreateGroupForm tournaments={tournaments} />
        </section>
      </main>
    </div>
  );
}
