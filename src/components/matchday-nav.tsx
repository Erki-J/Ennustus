"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/i18n/provider";
import type { MatchdayRound } from "@/lib/matchdays/queries";

type MatchdayNavProps = {
  basePath: string;
  rounds: MatchdayRound[];
  currentKey: string;
  bonusHref?: string;
  showBonusTab?: boolean;
  bonusActive?: boolean;
};

export function MatchdayNav({
  basePath,
  rounds,
  currentKey,
  bonusHref,
  showBonusTab = false,
  bonusActive = false,
}: MatchdayNavProps) {
  const t = useTranslations();
  const currentIndex = rounds.findIndex((round) => round.key === currentKey);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const prevRound = safeIndex > 0 ? rounds[safeIndex - 1] : null;
  const nextRound =
    safeIndex < rounds.length - 1 ? rounds[safeIndex + 1] : null;
  const currentRound = rounds[safeIndex];

  if (rounds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white">
        {prevRound ? (
          <Link
            href={`${basePath}/${prevRound.key}`}
            className="rounded-l-lg px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-emerald-50 hover:text-emerald-900"
            aria-label={t("nav.prevMatchday")}
          >
            ‹
          </Link>
        ) : (
          <span className="rounded-l-lg px-3 py-1.5 text-sm text-zinc-300">‹</span>
        )}
        <span className="border-x border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-900">
          {currentRound?.label ?? t("common.dash")}
        </span>
        {nextRound ? (
          <Link
            href={`${basePath}/${nextRound.key}`}
            className="rounded-r-lg px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-emerald-50 hover:text-emerald-900"
            aria-label={t("nav.nextMatchday")}
          >
            ›
          </Link>
        ) : (
          <span className="rounded-r-lg px-3 py-1.5 text-sm text-zinc-300">›</span>
        )}
      </div>

      {showBonusTab && bonusHref && (
        <Link
          href={bonusHref}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            bonusActive
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
              : "nav-link-inactive border border-zinc-200 bg-white"
          }`}
        >
          {t("nav.bonus")}
        </Link>
      )}
    </div>
  );
}
