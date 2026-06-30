import { notFound, redirect } from "next/navigation";
import { SettingsSubNav } from "@/components/settings/settings-sub-nav";
import { getProfile } from "@/lib/auth/get-profile";
import { getGroupContext } from "@/lib/groups/context";

export default async function SettingsLayout({
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

  if (!context || context.myRole !== "admin") {
    notFound();
  }

  return (
    <div className="space-y-4">
      <SettingsSubNav groupId={groupId} />
      <div>{children}</div>
    </div>
  );
}
