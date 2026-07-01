import type { AppLocale } from "@/lib/settings/locale";

export type Messages = Record<string, unknown>;

export type Translator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export type I18nContextValue = {
  locale: AppLocale;
  t: Translator;
};

export type { AppLocale };
