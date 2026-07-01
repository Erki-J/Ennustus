import type { AppLocale } from "@/lib/settings/locale";
import { getMessageLocale } from "@/lib/settings/locale";
import { en } from "@/lib/i18n/messages/en";
import { et } from "@/lib/i18n/messages/et";
import type { Messages } from "@/lib/i18n/types";

const messagesByUiLocale = {
  et,
  en,
} as const;

export function getMessages(locale: AppLocale): Messages {
  return messagesByUiLocale[getMessageLocale(locale)];
}
