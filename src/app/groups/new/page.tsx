import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { CreateGroupForm } from "@/components/create-group-form";
import { getProfile } from "@/lib/auth/get-profile";
import { getActiveTournaments } from "@/lib/groups/queries";

export default async function NewGroupPage() {
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
            Turniire pole andmebaasis. Käivita Supabase SQL Editoris fail{" "}
            <code>supabase/migration-002-groups.sql</code>.
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
            ← Tagasi
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
            Loo uus ennustus
          </h1>
          <p className="mt-1 text-zinc-600">
            Vali turniir, anna grupile nimi ja saad kohe adminina kutsed saata.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CreateGroupForm tournaments={tournaments} />
        </section>
      </main>
    </div>
  );
}
