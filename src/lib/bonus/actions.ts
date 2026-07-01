"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BonusActionState = {
  error?: string;
  success?: string;
};

function revalidateGroupModules(groupId: string) {
  const paths = [
    `/groups/${groupId}/bonus`,
    `/groups/${groupId}/overview`,
    `/groups/${groupId}/overview/bonus`,
    `/groups/${groupId}/prediction-centre`,
    `/groups/${groupId}/general-overview`,
    `/groups/${groupId}/settings`,
    `/groups/${groupId}/settings/scoring`,
    `/groups/${groupId}/settings/bonus`,
    `/groups/${groupId}/settings/predictions`,
    `/groups/${groupId}/matches`,
    `/groups/${groupId}`,
  ];
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function saveBonusPredictions(
  _prevState: BonusActionState,
  formData: FormData,
): Promise<BonusActionState> {
  const groupId = String(formData.get("group_id") ?? "");

  if (!groupId) {
    return { error: "Grupp puudub." };
  }

  const supabase = await createClient();
  let saved = 0;

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("question_")) {
      continue;
    }

    const questionId = key.replace("question_", "");
    const answer = String(value).trim();

    if (!answer) {
      continue;
    }

    const { error } = await supabase.rpc("save_bonus_prediction", {
      p_group_id: groupId,
      p_question_id: questionId,
      p_answer: answer,
      p_as_admin: false,
    });

    if (error) {
      return { error: error.message };
    }

    saved += 1;
  }

  if (saved === 0) {
    return { error: "Sisesta vähemalt üks vastus." };
  }

  revalidateGroupModules(groupId);
  return { success: "Boonused salvestatud." };
}

export async function setBonusCorrectAnswer(
  _prevState: BonusActionState,
  formData: FormData,
): Promise<BonusActionState> {
  const groupId = String(formData.get("group_id") ?? "");
  const questionId = String(formData.get("question_id") ?? "");
  const correctAnswer = String(formData.get("correct_answer") ?? "").trim();

  if (!groupId || !questionId) {
    return { error: "Puuduvad andmed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_bonus_correct_answer", {
    p_question_id: questionId,
    p_correct_answer: correctAnswer,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGroupModules(groupId);
  return { success: "Õige vastus salvestatud, punktid uuendatud." };
}

export async function adminSaveMemberBonus(
  _prevState: BonusActionState,
  formData: FormData,
): Promise<BonusActionState> {
  const groupId = String(formData.get("group_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const questionId = String(formData.get("question_id") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();

  if (!groupId || !userId || !questionId || !answer) {
    return { error: "Palun täida kõik väljad." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_member_bonus", {
    p_group_id: groupId,
    p_user_id: userId,
    p_question_id: questionId,
    p_answer: answer,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGroupModules(groupId);
  return { success: "Boonus uuendatud." };
}
