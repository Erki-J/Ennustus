export function buildInviteUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}/join/${token}`;
}

export function buildMailtoLink(
  email: string,
  groupName: string,
  inviteUrl: string,
): string {
  const subject = encodeURIComponent(`Kutse ennustusgruppi: ${groupName}`);
  const body = encodeURIComponent(
    `Tere!\n\nKutsun sind liituma ennustusgrupiga "${groupName}".\n\nAva link ja loo konto (või logi sisse sama e-mailiga):\n${inviteUrl}\n`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
