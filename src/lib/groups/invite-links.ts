import type { Translator } from "@/lib/i18n/types";

export function buildInviteUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}/join/${token}`;
}

export function buildMailtoLink(
  email: string,
  groupName: string,
  tournamentName: string,
  inviteUrl: string,
  t: Translator,
): string {
  const subject = encodeURIComponent(
    t("group.inviteEmailSubject", { groupName }),
  );
  const body = encodeURIComponent(
    t("group.inviteEmailBody", {
      groupName,
      tournamentName,
      link: inviteUrl,
    }),
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
