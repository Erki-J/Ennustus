"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass = (active: boolean) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : "text-zinc-600 hover:bg-zinc-100"
  }`;

export function GroupNavLinks({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const base = `/groups/${groupId}`;
  const settingsHref = `${base}/settings`;

  const mainItems = [
    { href: base, label: "Avaleht", key: "home" },
    { href: `${base}/overview`, label: "Ülevaade", key: "overview" },
    {
      href: `${base}/general-overview`,
      label: "Üldine ülevaade",
      key: "general-overview",
    },
    {
      href: `${base}/prediction-centre`,
      label: "Ennustuskeskus",
      key: "prediction-centre",
    },
  ];

  function isActive(href: string) {
    if (href === base) {
      return pathname === base;
    }
    return pathname.startsWith(href);
  }

  const settingsActive = pathname.startsWith(settingsHref);

  return (
    <nav className="flex flex-wrap items-start gap-2 border-b border-zinc-200 pb-4">
      {mainItems.map((item) => (
        <Link key={item.key} href={item.href} className={linkClass(isActive(item.href))}>
          {item.label}
        </Link>
      ))}

      {isAdmin && (
        <Link
          href={`${settingsHref}/scoring`}
          className={linkClass(settingsActive)}
        >
          Seaded
        </Link>
      )}
    </nav>
  );
}
