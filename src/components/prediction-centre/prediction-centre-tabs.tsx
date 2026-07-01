"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/lib/i18n/provider";

export function PredictionCentreTabs({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const t = useTranslations();
  const base = `/groups/${groupId}/prediction-centre`;
  const bonusPath = `${base}/bonus`;

  const tabs = [
    { href: base, label: t("nav.matches"), key: "matches" },
    { href: bonusPath, label: t("nav.bonus"), key: "bonus" },
  ];

  return (
    <div className="flex gap-2 border-b border-zinc-100 pb-3">
      {tabs.map((tab) => {
        const active =
          tab.key === "bonus"
            ? pathname.startsWith(bonusPath)
            : pathname.startsWith(base) && !pathname.startsWith(bonusPath);

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                : "nav-link-inactive"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
