"use client";

import { useActionState } from "react";
import {
  updateGroupCron,
  type SettingsActionState,
} from "@/lib/settings/actions";
import type { CronSettings } from "@/types/database";

const initialState: SettingsActionState = {};

export function SettingsCronForm({
  groupId,
  cron,
}: {
  groupId: string;
  cron: CronSettings;
}) {
  const [state, formAction, pending] = useActionState(updateGroupCron, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="group_id" value={groupId} />

      <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={cron.enabled}
          className="size-4 rounded border-zinc-300 text-emerald-600"
        />
        <span className="text-sm font-medium text-zinc-900">Cron on sees</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Päringu algus</label>
          <input
            type="text"
            value="Mängu algus (kickoff)"
            readOnly
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
          />
        </div>

        <div>
          <label htmlFor="interval_minutes" className="mb-1 block text-sm font-medium">
            Intervall (minutit)
          </label>
          <input
            id="interval_minutes"
            name="interval_minutes"
            type="number"
            min={1}
            max={120}
            required
            defaultValue={cron.interval_minutes}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="match_duration_minutes"
            className="mb-1 block text-sm font-medium"
          >
            Eeldatav mängu kestus (min)
          </label>
          <input
            id="match_duration_minutes"
            name="match_duration_minutes"
            type="number"
            min={60}
            max={150}
            required
            defaultValue={cron.match_duration_minutes}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Kasutatakse mängu lõpu hinnanguna (vaikimisi 105 min).
          </p>
        </div>

        <div>
          <label
            htmlFor="window_end_offset_minutes"
            className="mb-1 block text-sm font-medium"
          >
            Päringu lõpp: mängu lõpp + (min)
          </label>
          <input
            id="window_end_offset_minutes"
            name="window_end_offset_minutes"
            type="number"
            min={0}
            max={240}
            required
            defaultValue={cron.window_end_offset_minutes}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Näide: 60 = päringud kuni mängu eeldatav lõpp + 1 tund.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Salvestan…" : "Salvesta cron seaded"}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}
    </form>
  );
}
