"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "@/lib/i18n/provider";

const linkClass = (active: boolean) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : "nav-link-inactive"
  }`;

export function GroupNavLinks({
  groupId,
  isAdmin,
  overviewHref,
  predictionCentreHref,
  prefetchRoutes,
}: {
  groupId: string;
  isAdmin: boolean;
  overviewHref: string;
  predictionCentreHref: string;
  prefetchRoutes: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const base = `/groups/${groupId}`;
  const matchesHref = `${base}/matches`;
  const bonusResultsHref = `${base}/bonus-results`;
  const settingsHref = `${base}/settings`;

  useEffect(() => {
    for (const route of prefetchRoutes) {
      router.prefetch(route);
    }
    if (isAdmin) {
      router.prefetch(matchesHref);
      router.prefetch(bonusResultsHref);
    }
  }, [bonusResultsHref, isAdmin, matchesHref, prefetchRoutes, router]);

  const mainItems = [
    { href: base, label: t("nav.home"), key: "home" },
    { href: overviewHref, label: t("nav.overview"), key: "overview" },
    {
      href: `${base}/general-overview`,
      label: t("nav.generalOverview"),
      key: "general-overview",
    },
    {
      href: predictionCentreHref,
      label: t("nav.predictionCentre"),
      key: "prediction-centre",
    },
  ];

  function isActive(href: string) {
    if (href === base) {
      return pathname === base;
    }
    if (href.startsWith(`${base}/overview/`)) {
      return pathname.startsWith(`${base}/overview`);
    }
    if (href.startsWith(`${base}/prediction-centre/`)) {
      return pathname.startsWith(`${base}/prediction-centre`);
    }
    return pathname.startsWith(href);
  }

  const matchesActive = pathname.startsWith(matchesHref);
  const bonusResultsActive = pathname.startsWith(bonusResultsHref);
  const settingsActive = pathname.startsWith(settingsHref);

  return (
    <nav className="flex flex-wrap items-start gap-2 border-b border-zinc-200 pb-4">
      {mainItems.map((item) => (
        <Link key={item.key} href={item.href} prefetch className={linkClass(isActive(item.href))}>
          {item.label}
        </Link>
      ))}

      {isAdmin && (
        <>
          <Link href={matchesHref} prefetch className={linkClass(matchesActive)}>
            {t("nav.matchResults")}
          </Link>
          <Link href={bonusResultsHref} prefetch className={linkClass(bonusResultsActive)}>
            {t("nav.bonusResults")}
          </Link>
        </>
      )}

      <Link
        href={`${settingsHref}/general`}
        prefetch
        className={linkClass(settingsActive)}
      >
        {t("nav.settings")}
      </Link>
    </nav>
  );
}
