import type { AppLocale } from "@/lib/settings/locale";

/** Kickoff times are stored as UTC; display in Estonian local time. */
export const DISPLAY_TIMEZONE = "Europe/Tallinn";

function dateTimeOptions(locale: AppLocale): Intl.DateTimeFormatOptions {
  return {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIMEZONE,
  };
}

function dateOptions(locale: AppLocale): Intl.DateTimeFormatOptions {
  return {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: DISPLAY_TIMEZONE,
  };
}

export function formatDateTime(iso: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "et-EE",
    dateTimeOptions(locale),
  ).format(new Date(iso));
}

export function formatDate(iso: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "et-EE",
    dateOptions(locale),
  ).format(new Date(iso));
}
