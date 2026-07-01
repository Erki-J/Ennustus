export const SUPPORTED_LOCALES = ["et", "en", "et-en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export type MessageLocale = "et" | "en";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  et: "Eesti",
  en: "English",
  "et-en": "Eesti + riigid ENG",
};

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** UI translation file: et-en uses Estonian strings. */
export function getMessageLocale(locale: AppLocale): MessageLocale {
  return locale === "en" ? "en" : "et";
}

/** Team names and table abbreviations in English. */
export function usesEnglishTeamNames(locale: AppLocale): boolean {
  return locale === "en" || locale === "et-en";
}

export function getHtmlLang(locale: AppLocale): string {
  return locale === "en" ? "en" : "et";
}

export function getDateFormatLocale(locale: AppLocale): "et-EE" | "en-GB" {
  return locale === "en" ? "en-GB" : "et-EE";
}

export function getTeamSortLocale(locale: AppLocale): string {
  return usesEnglishTeamNames(locale) ? "en" : "et";
}
