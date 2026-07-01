"use client";

import { useActionState } from "react";
import {
  updateGroupScoring,
  type SettingsActionState,
} from "@/lib/settings/actions";
import type { ScoringSettings } from "@/types/database";

const initialState: SettingsActionState = {};

export function SettingsScoringForm({
  groupId,
  scoring,
}: {
  groupId: string;
  scoring: ScoringSettings;
}) {
  const [state, formAction, pending] = useActionState(updateGroupScoring, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-5">
      <input type="hidden" name="group_id" value={groupId} />
      <div>
        <label className="mb-1 block text-sm font-medium">Täpne skoor</label>
        <input
          name="exact_score"
          type="number"
          min={0}
          defaultValue={scoring.exact_score}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Õige vahe</label>
        <input
          name="goal_diff"
          type="number"
          min={0}
          defaultValue={scoring.goal_diff}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Võitja</label>
        <input
          name="tendency"
          type="number"
          min={0}
          defaultValue={scoring.tendency}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Viik</label>
        <input
          name="draw_points"
          type="number"
          min={0}
          defaultValue={scoring.draw_points ?? 2}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Boonuse punktid</label>
        <input
          name="bonus_points"
          type="number"
          min={0}
          defaultValue={scoring.bonus_points ?? 4}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Salvestan…" : "Uuenda punktireegleid"}
        </button>
        {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="mt-2 text-sm text-emerald-700">{state.success}</p>
        )}
      </div>
    </form>
  );
}
