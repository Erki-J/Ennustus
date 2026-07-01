"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
};

function safeRedirectPath(path: string | null | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/dashboard";
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getTranslations();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: t("auth.errorEmailPassword") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("email not confirmed")) {
      return { error: t("auth.errorEmailNotConfirmed") };
    }

    if (message.includes("invalid login credentials")) {
      return { error: t("auth.errorInvalidCredentials") };
    }

    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function register(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getTranslations();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!displayName || !email || !password) {
    return { error: t("auth.errorFillAll") };
  }

  if (password.length < 8) {
    return { error: t("auth.errorPasswordLength") };
  }

  if (password !== passwordConfirm) {
    return { error: t("auth.errorPasswordMismatch") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
