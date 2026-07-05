"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/lib/i18n/provider";

function tabClass(active: boolean) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : "nav-link-inactive"
  }`;
}

export function SettingsSubNav({
  groupId,
  isAdmin,
}: {
  groupId: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const base = `/groups/${groupId}/settings`;

  const tabs = [
    { key: "general", hrefSuffix: "/general", label: t("settingsNav.general") },
    ...(isAdmin
      ? [
          { key: "scoring", hrefSuffix: "/scoring", label: t("settingsNav.scoring") },
          {
            key: "predictions",
            hrefSuffix: "/predictions",
            label: t("settingsNav.predictions"),
          },
          {
            key: "members",
            hrefSuffix: "/members",
            label: t("settingsNav.members"),
          },
          { key: "cron", hrefSuffix: "/cron", label: t("settingsNav.cron") },
        ]
      : []),
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = `${base}${tab.hrefSuffix}`;
        const active = pathname.startsWith(href);

        return (
          <Link key={tab.key} href={href} className={tabClass(active)}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
