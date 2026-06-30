import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { GroupCard } from "@/components/group-card";
import { InstallAppBanner } from "@/components/install-app-banner";
import { getProfile } from "@/lib/auth/get-profile";
import { getMyGroups, getMyPendingInvitations } from "@/lib/groups/queries";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const groups = await getMyGroups();
  const pendingInvites = await getMyPendingInvitations();

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

        <InstallAppBanner />

        {pendingInvites.length > 0 && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <h2 className="font-semibold text-zinc-900">Sul on ootel kutseid</h2>
            <ul className="mt-4 space-y-3">
              {pendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{invite.group_name}</p>
                    <p className="text-sm text-zinc-500">{invite.tournament_name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Kutse aadressile {invite.email}
                    </p>
                  </div>
                  <Link
                    href={`/join/${invite.token}`}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Liitu grupiga
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

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
