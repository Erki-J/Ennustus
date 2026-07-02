"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export type GroupActionState = {
  error?: string;
  success?: string;
};

export async function createPredictionGroup(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const t = await getTranslations();
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const tournamentId = String(formData.get("tournament_id") ?? "").trim();

  if (!name || !nickname || !tournamentId) {
    return { error: t("group.errorFillFields") };
  }

  if (nickname.length < 2) {
    return { error: t("group.errorNicknameMin") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("group.errorMustLogin") };
  }

  const { data: group, error: groupError } = await supabase
    .from("prediction_groups")
    .insert({
      name,
      tournament_id: tournamentId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (groupError || !group) {
    return { error: groupError?.message ?? t("group.errorCreateGroup") };
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin",
    nickname,
  });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${group.id}`);
}

export async function inviteToGroup(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const emailsRaw = String(formData.get("emails") ?? "").trim();

  if (!groupId || !emailsRaw) {
    return { error: t("group.errorEmailRequired") };
  }

  const emails = [
    ...new Set(
      emailsRaw
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  if (emails.length === 0) {
    return { error: t("group.errorEmailInvalid") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("group.errorMustLogin") };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "admin") {
    return { error: t("group.errorAdminOnly") };
  }

  const { error } = await supabase.from("group_invitations").upsert(
    emails.map((email) => ({
      group_id: groupId,
      email,
      invited_by: user.id,
      status: "pending" as const,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })),
    { onConflict: "group_id,email" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return {
    success:
      emails.length === 1
        ? t("group.inviteCreated", { email: emails[0] })
        : t("group.inviteEachGetsLink"),
  };
}

export async function acceptInvitation(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const t = await getTranslations();
  const token = String(formData.get("token") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const restoreRaw = String(formData.get("restore_history") ?? "").trim();

  if (!token || !nickname) {
    return { error: t("group.errorNicknameRequired") };
  }

  let restoreHistory: boolean | null = null;
  if (restoreRaw === "true") {
    restoreHistory = true;
  } else if (restoreRaw === "false") {
    restoreHistory = false;
  }

  const supabase = await createClient();
  const { data: groupId, error } = await supabase.rpc("accept_group_invitation", {
    p_token: token,
    p_nickname: nickname,
    p_restore_history: restoreHistory,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${groupId}`);
}

export async function removeGroupMember(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();

  if (!groupId || !userId) {
    return { error: t("group.errorMemberMissing") };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_group_member", {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  return { success: t("group.removeSuccess") };
}

export async function revokeInvitation(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const invitationId = String(formData.get("invitation_id") ?? "").trim();

  if (!groupId || !invitationId) {
    return { error: t("group.errorInviteMissing") };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_group_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: t("group.inviteDeleted") };
}

export async function updateMyNickname(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!groupId || !nickname) {
    return { error: t("group.errorNicknameRequired") };
  }

  if (nickname.length < 2) {
    return { error: t("group.errorNicknameLength") };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_group_nickname", {
    p_group_id: groupId,
    p_nickname: nickname,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  return { success: t("group.nicknameUpdated") };
}

export async function updateGroupName(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const t = await getTranslations();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!groupId || !name) {
    return { error: t("group.errorGroupNameRequired") };
  }

  if (name.length < 2) {
    return { error: t("group.errorGroupNameMin") };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_group_name", {
    p_group_id: groupId,
    p_name: name,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  return { success: t("group.groupNameUpdated") };
}
