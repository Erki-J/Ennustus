import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { isPlatformAdmin } from "@/lib/admin/roles";
import type { Profile } from "@/types/database";

export async function requirePlatformAdmin(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return profile;
}

export { isPlatformAdmin } from "@/lib/admin/roles";
