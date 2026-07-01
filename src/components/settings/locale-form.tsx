"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { updateMyLocale, type SettingsActionState } from "@/lib/settings/actions";
import { useTranslations } from "@/lib/i18n/provider";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from "@/lib/settings/locale";

const initialState: SettingsActionState = {};

type LocaleFormProps = {
  locale: AppLocale;
};

export function LocaleForm({ locale }: LocaleFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateMyLocale, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="max-w-xs">
        <label htmlFor="locale" className="mb-1 block text-sm font-medium text-zinc-700">
          {t("settings.language")}
        </label>
        <select
          id="locale"
          name="locale"
          defaultValue={locale}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
        >
          {SUPPORTED_LOCALES.map((value) => (
            <option key={value} value={value}>
              {LOCALE_LABELS[value]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">{t("settings.languageHint")}</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? t("common.saving") : t("common.save")}
      </button>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      )}
    </form>
  );
}
