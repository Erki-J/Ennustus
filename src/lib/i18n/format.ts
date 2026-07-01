import type { AppLocale } from "@/lib/settings/locale";

export function formatDateTime(iso: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "et-EE", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "et-EE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
