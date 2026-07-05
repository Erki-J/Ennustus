import { notFound, redirect } from "next/navigation";
import { SettingsMembersManagement } from "@/components/settings/members-management";
import { getProfile } from "@/lib/auth/get-profile";
import { getGroupById } from "@/lib/groups/queries";
import { getSettingsLayoutContext } from "@/lib/settings/access";
import { getI18n } from "@/lib/i18n/server";

type SettingsMembersPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsMembersPage({ params }: SettingsMembersPageProps) {
  const { t } = await getI18n();
  const { groupId } = await params;
  const layoutContext = await getSettingsLayoutContext(groupId);

  if (!layoutContext?.isAdmin) {
    const profile = await getProfile();
    if (!profile) {
      redirect("/login");
    }
    notFound();
  }

  const profile = await getProfile();
  const group = await getGroupById(groupId);

  if (!group || !profile) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{t("settingsMembers.pageTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t("settingsMembers.pageSubtitle")}</p>
      </div>

      <SettingsMembersManagement
        groupId={group.id}
        groupName={group.name}
        tournamentName={group.tournament.name}
        currentUserId={profile.id}
        members={group.members.map((member) => ({
          ...member,
          is_managed: member.is_managed ?? false,
        }))}
        invitations={group.invitations}
      />
    </section>
  );
}
