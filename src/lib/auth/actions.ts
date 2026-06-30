"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Palun sisesta e-mail ja parool." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("email not confirmed")) {
      return {
        error:
          "E-mail pole kinnitatud. Supabase: Authentication → Providers → Email → lülita Confirm email välja, seejärel registreeru uuesti.",
      };
    }

    if (message.includes("invalid login credentials")) {
      return {
        error:
          "Vale e-mail või parool. Kui sul pole veel kontot, kasuta allpool „Registreeru”.",
      };
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
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!displayName || !email || !password) {
    return { error: "Palun täida kõik väljad." };
  }

  if (password.length < 8) {
    return { error: "Parool peab olema vähemalt 8 tähemärki." };
  }

  if (password !== passwordConfirm) {
    return { error: "Paroolid ei kattu." };
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
