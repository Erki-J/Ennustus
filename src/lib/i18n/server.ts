import { getRequestLocale } from "@/lib/i18n/get-locale";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import type { AppLocale, Translator } from "@/lib/i18n/types";

export async function getLocale(): Promise<AppLocale> {
  return getRequestLocale();
}

export async function getTranslations(): Promise<Translator> {
  const locale = await getRequestLocale();
  return createTranslator(getMessages(locale));
}

export async function getI18n() {
  const locale = await getRequestLocale();
  const t = createTranslator(getMessages(locale));
  return { locale, t };
}
