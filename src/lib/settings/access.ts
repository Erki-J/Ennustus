import { getProfile } from "@/lib/auth/get-profile";
import { getGroupContext } from "@/lib/groups/context";

export async function getSettingsLayoutContext(groupId: string) {
  const profile = await getProfile();

  if (!profile) {
    return null;
  }

  const context = await getGroupContext(groupId);

  if (!context) {
    return null;
  }

  return {
    profile,
    context,
    isAdmin: context.myRole === "admin",
  };
}
