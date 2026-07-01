import type { AppLocale } from "@/lib/settings/locale";
import { en } from "@/lib/i18n/messages/en";
import { et } from "@/lib/i18n/messages/et";
import type { Messages } from "@/lib/i18n/types";

const messagesByLocale: Record<AppLocale, Messages> = {
  et,
  en,
};

export function getMessages(locale: AppLocale): Messages {
  return messagesByLocale[locale];
}
