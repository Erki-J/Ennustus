"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/lib/i18n/provider";

const linkClass = (active: boolean) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : "nav-link-inactive"
  }`;

export function GroupNavLinks({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useTranslations();
  const base = `/groups/${groupId}`;
  const matchesHref = `${base}/matches`;
  const bonusResultsHref = `${base}/bonus-results`;
  const settingsHref = `${base}/settings`;

  const mainItems = [
    { href: base, label: t("nav.home"), key: "home" },
    { href: `${base}/overview`, label: t("nav.overview"), key: "overview" },
    {
      href: `${base}/general-overview`,
      label: t("nav.generalOverview"),
      key: "general-overview",
    },
    {
      href: `${base}/prediction-centre`,
      label: t("nav.predictionCentre"),
      key: "prediction-centre",
    },
  ];

  function isActive(href: string) {
    if (href === base) {
      return pathname === base;
    }
    return pathname.startsWith(href);
  }

  const matchesActive = pathname.startsWith(matchesHref);
  const bonusResultsActive = pathname.startsWith(bonusResultsHref);
  const settingsActive = pathname.startsWith(settingsHref);

  return (
    <nav className="flex flex-wrap items-start gap-2 border-b border-zinc-200 pb-4">
      {mainItems.map((item) => (
        <Link key={item.key} href={item.href} className={linkClass(isActive(item.href))}>
          {item.label}
        </Link>
      ))}

      {isAdmin && (
        <>
          <Link href={matchesHref} className={linkClass(matchesActive)}>
            {t("nav.matchResults")}
          </Link>
          <Link href={bonusResultsHref} className={linkClass(bonusResultsActive)}>
            {t("nav.bonusResults")}
          </Link>
        </>
      )}

      <Link href={`${settingsHref}/general`} className={linkClass(settingsActive)}>
        {t("nav.settings")}
      </Link>
    </nav>
  );
}
