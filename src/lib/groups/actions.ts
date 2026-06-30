"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type GroupActionState = {
  error?: string;
  success?: string;
};

export async function createPredictionGroup(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const tournamentId = String(formData.get("tournament_id") ?? "").trim();

  if (!name || !nickname || !tournamentId) {
    return { error: "Palun täida kõik väljad." };
  }

  if (nickname.length < 2) {
    return { error: "Hüüdnimi peab olema vähemalt 2 tähemärki." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Pead olema sisse logitud." };
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
    return { error: groupError?.message ?? "Grupi loomine ebaõnnestus." };
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
  const groupId = String(formData.get("group_id") ?? "").trim();
  const emailsRaw = String(formData.get("emails") ?? "").trim();

  if (!groupId || !emailsRaw) {
    return { error: "Sisesta vähemalt üks e-mail." };
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
    return { error: "Sisesta kehtiv e-mail." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Pead olema sisse logitud." };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "admin") {
    return { error: "Ainult grupi admin saab kutsed saata." };
  }

  const { error } = await supabase.from("group_invitations").upsert(
    emails.map((email) => ({
      group_id: groupId,
      email,
      invited_by: user.id,
      status: "pending" as const,
    })),
    { onConflict: "group_id,email" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return {
    success: `Kutse loodud ${emails.length} aadressile. Saada neile kutse link allpool.`,
  };
}

export async function acceptInvitation(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const token = String(formData.get("token") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!token || !nickname) {
    return { error: "Palun sisesta hüüdnimi." };
  }

  const supabase = await createClient();
  const { data: groupId, error } = await supabase.rpc("accept_group_invitation", {
    p_token: token,
    p_nickname: nickname,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${groupId}`);
}

export async function revokeInvitation(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupId = String(formData.get("group_id") ?? "").trim();
  const invitationId = String(formData.get("invitation_id") ?? "").trim();

  if (!groupId || !invitationId) {
    return { error: "Kutse puudub." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_group_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: "Kutse kustutatud." };
}

export async function updateMyNickname(
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupId = String(formData.get("group_id") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!groupId || !nickname) {
    return { error: "Palun sisesta mängijanimi." };
  }

  if (nickname.length < 2) {
    return { error: "Mängijanimi peab olema vähemalt 2 tähemärki." };
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
  return { success: "Mängijanimi uuendatud." };
}
