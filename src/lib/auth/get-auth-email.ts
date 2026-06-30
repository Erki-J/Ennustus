import { createClient } from "@/lib/supabase/server";

export async function getAuthUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email ?? null;
}
