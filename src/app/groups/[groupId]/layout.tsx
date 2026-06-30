import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { GroupNavLinks } from "@/components/group-nav-links";
import { getProfile } from "@/lib/auth/get-profile";
import { getGroupContext } from "@/lib/groups/context";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const context = await getGroupContext(groupId);

  if (!context) {
    notFound();
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 hover:underline"
          >
            ← Minu ennustused
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-900">
              {context.groupName}
            </h1>
            {context.myRole === "admin" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Admin
              </span>
            )}
          </div>
          <p className="mt-1 text-zinc-600">{context.tournament.name}</p>
        </div>

        <GroupNavLinks
          groupId={groupId}
          isAdmin={context.myRole === "admin"}
        />

        {children}
      </main>
    </div>
  );
}
