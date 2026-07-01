import { notFound, redirect } from "next/navigation";
import { SettingsSubNav } from "@/components/settings/settings-sub-nav";
import { getProfile } from "@/lib/auth/get-profile";
import { getSettingsLayoutContext } from "@/lib/settings/access";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const layoutContext = await getSettingsLayoutContext(groupId);

  if (!layoutContext) {
    const profile = await getProfile();
    if (!profile) {
      redirect("/login");
    }
    notFound();
  }

  return (
    <div className="space-y-4">
      <SettingsSubNav groupId={groupId} isAdmin={layoutContext.isAdmin} />
      <div>{children}</div>
    </div>
  );
}
