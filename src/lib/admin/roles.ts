import type { Profile } from "@/types/database";

export function isPlatformAdmin(profile: Pick<Profile, "role"> | null): boolean {
  return profile?.role === "admin";
}
