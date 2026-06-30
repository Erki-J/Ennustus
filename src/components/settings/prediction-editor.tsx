"use client";

import { useActionState } from "react";
import {
  adminSaveMemberPrediction,
  type SettingsActionState,
} from "@/lib/settings/actions";

const initialState: SettingsActionState = {};

type SettingsPredictionEditorProps = {
  groupId: string;
  userId: string;
  matchId: string;
  matchLabel: string;
  kickoffLabel?: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

export function SettingsPredictionEditor({
  groupId,
  userId,
  matchId,
  matchLabel,
  kickoffLabel,
  homeGoals,
  awayGoals,
}: SettingsPredictionEditorProps) {
  const [state, formAction, pending] = useActionState(
    adminSaveMemberPrediction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-lg bg-zinc-50 p-3">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="match_id" value={matchId} />
      <div className="min-w-40 flex-1">
        <p className="text-sm font-medium text-zinc-800">{matchLabel}</p>
        {kickoffLabel && <p className="text-xs text-zinc-500">{kickoffLabel}</p>}
      </div>
      <div className="flex items-center gap-1">
        <input
          name="home_goals"
          type="number"
          min={0}
          max={20}
          required
          defaultValue={homeGoals ?? 0}
          className="w-14 rounded border border-zinc-300 px-2 py-1 text-center text-sm"
        />
        <span>:</span>
        <input
          name="away_goals"
          type="number"
          min={0}
          max={20}
          required
          defaultValue={awayGoals ?? 0}
          className="w-14 rounded border border-zinc-300 px-2 py-1 text-center text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "…" : "Salvesta"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="w-full text-xs text-emerald-700">{state.success}</p>
      )}
    </form>
  );
}
