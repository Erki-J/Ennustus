import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { GroupCard } from "@/components/group-card";
import { getProfile } from "@/lib/auth/get-profile";
import { getMyGroups } from "@/lib/groups/queries";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const groups = await getMyGroups();

  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Minu ennustused</h1>
            <p className="mt-1 text-zinc-600">
              Vali grupp või loo uus ennustusmäng sõpradega.
            </p>
          </div>
          <Link
            href="/groups/new"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Loo uus ennustus
          </Link>
        </section>

        {groups.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="text-zinc-600">Sa pole ühegi grupiga liitunud.</p>
            <Link
              href="/groups/new"
              className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
            >
              Loo esimene ennustusgrupp →
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
