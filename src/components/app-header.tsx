"use client";

import { logout } from "@/lib/auth/actions";
import { useTranslations } from "@/lib/i18n/provider";
import type { Profile } from "@/types/database";

type AppHeaderProps = {
  profile: Profile;
};

export function AppHeader({ profile }: AppHeaderProps) {
  const t = useTranslations();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-lg font-semibold text-zinc-900">{t("common.appName")}</p>
          <p className="text-sm text-zinc-500">
            {t("header.greeting", {
              name: profile.display_name ?? profile.email,
            })}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            {t("header.logout")}
          </button>
        </form>
      </div>
    </header>
  );
}
