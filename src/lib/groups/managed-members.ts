import { createAdminClient } from "@/lib/supabase/admin";

const MANAGED_EMAIL_DOMAIN = "players.ennustus.local";

export function isManagedPlayerEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return email.toLowerCase().endsWith(`@${MANAGED_EMAIL_DOMAIN}`);
}

export function buildManagedPlayerEmail(): string {
  return `managed+${crypto.randomUUID()}@${MANAGED_EMAIL_DOMAIN}`;
}

export async function createManagedAuthUser(nickname: string): Promise<{
  userId: string;
  error?: string;
}> {
  const admin = createAdminClient();
  if (!admin) {
    return { userId: "", error: "SUPABASE_SERVICE_ROLE_KEY puudub" };
  }

  const trimmedNickname = nickname.trim();
  const email = buildManagedPlayerEmail();
  const password = crypto.randomUUID();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      managed: true,
      display_name: trimmedNickname,
    },
  });

  if (error || !data.user) {
    return { userId: "", error: error?.message ?? "Kasutaja loomine ebaõnnestus" };
  }

  return { userId: data.user.id };
}

export async function deleteManagedAuthUser(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) {
    return "SUPABASE_SERVICE_ROLE_KEY puudub";
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  return error?.message ?? null;
}
