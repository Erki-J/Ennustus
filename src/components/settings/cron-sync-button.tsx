"use client";

import { useActionState } from "react";
import {
  triggerCronSyncNow,
  type SettingsActionState,
} from "@/lib/settings/actions";
import { useTranslations } from "@/lib/i18n/provider";

const initialState: SettingsActionState = {};

export function SettingsCronSyncButton({ groupId }: { groupId: string }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(triggerCronSyncNow, initialState);

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="group_id" value={groupId} />
      <button
        type="submit"
        disabled={pending}
        className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? t("settings.cronSyncRunning") : t("settings.cronSyncNow")}
      </button>
      <p className="mt-1 text-xs text-zinc-500">{t("settings.cronSyncNowHint")}</p>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-emerald-700">{state.success}</p>}
    </form>
  );
}
