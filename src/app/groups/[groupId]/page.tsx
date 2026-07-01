import { notFound, redirect } from "next/navigation";
import { InviteForm } from "@/components/invite-form";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { UpdateNicknameForm } from "@/components/update-nickname-form";
import { getProfile } from "@/lib/auth/get-profile";
import { getGroupById } from "@/lib/groups/queries";

type GroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const group = await getGroupById(groupId);

  if (!group) {
    notFound();
  }

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Avaleht</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Grupi info ja liikmed. Ennustused: vaata Ülevaade, Ennustuskeskus või Edetabel.
        </p>
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <UpdateNicknameForm groupId={group.id} nickname={group.myNickname} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Mängijad ({group.members.length})</h2>
        <ul className="mt-4 space-y-2">
          {group.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-zinc-900">
                {member.nickname}
                {member.user_id === profile.id && (
                  <span className="ml-2 font-normal text-zinc-500">(sina)</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">
                  {member.role === "admin" ? "Admin" : "Mängija"}
                </span>
                {group.myRole === "admin" &&
                  member.role !== "admin" &&
                  member.user_id !== profile.id && (
                    <RemoveMemberButton
                      groupId={group.id}
                      userId={member.user_id}
                      nickname={member.nickname}
                    />
                  )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {group.myRole === "admin" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Kutsu mängijaid</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Sisesta e-mailid. Saada kutse link e-mailiga või kopeeri link.
          </p>
          <div className="mt-4">
            <InviteForm
              groupId={group.id}
              groupName={group.name}
              invitations={group.invitations}
            />
          </div>
        </section>
      )}
    </>
  );
}
