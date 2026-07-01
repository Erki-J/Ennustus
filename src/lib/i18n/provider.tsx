"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createTranslator } from "@/lib/i18n/translate";
import type { AppLocale, I18nContextValue, Messages, Translator } from "@/lib/i18n/types";

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: AppLocale;
  messages: Messages;
  children: ReactNode;
};

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const t = createTranslator(messages);

  return (
    <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>
  );
}

function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslations must be used within I18nProvider");
  }
  return context;
}

export function useLocale(): AppLocale {
  return useI18nContext().locale;
}

export function useTranslations(): Translator {
  return useI18nContext().t;
}
