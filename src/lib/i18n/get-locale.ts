import { cookies } from "next/headers";
import { getProfile } from "@/lib/auth/get-profile";
import { isAppLocale, type AppLocale } from "@/lib/settings/locale";

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;

  if (cookieLocale && isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const profile = await getProfile();
  if (profile?.locale && isAppLocale(profile.locale)) {
    return profile.locale;
  }

  return "et";
}
