"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const generalTab = {
  key: "general",
  hrefSuffix: "/general",
  label: "Üldine",
} as const;

const adminTabs = [
  { key: "scoring", hrefSuffix: "/scoring", label: "Punktireeglid" },
  { key: "predictions", hrefSuffix: "/predictions", label: "Muuda mängijate ennustusi" },
  { key: "cron", hrefSuffix: "/cron", label: "Cron" },
] as const;

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
  const base = `/groups/${groupId}/settings`;
  const tabs = [generalTab, ...(isAdmin ? adminTabs : [])];

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
