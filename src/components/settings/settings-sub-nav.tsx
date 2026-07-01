"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { key: "scoring", hrefSuffix: "/scoring", label: "Punktireeglid" },
  { key: "bonus", hrefSuffix: "/bonus", label: "Boonuse tulemused" },
  { key: "predictions", hrefSuffix: "/predictions", label: "Muuda mängijate ennustusi" },
] as const;

function tabClass(active: boolean) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : "text-zinc-600 hover:bg-zinc-100"
  }`;
}

export function SettingsSubNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const base = `/groups/${groupId}/settings`;

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
