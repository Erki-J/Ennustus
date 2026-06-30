"use client";

import { useActionState } from "react";
import {
  setMatchResult,
  type AdminMatchesActionState,
} from "@/lib/admin-matches/actions";
import type { MatchWithPrediction } from "@/lib/prediction-centre/queries";

const initialState: AdminMatchesActionState = {};

export function AdminMatchesResultForm({
  groupId,
  match,
}: {
  groupId: string;
  match: MatchWithPrediction;
}) {
  const [state, formAction, pending] = useActionState(setMatchResult, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="match_id" value={match.id} />
      <div className="min-w-48 flex-1">
        <p className="font-medium text-zinc-900">
          {match.home_team} – {match.away_team}
        </p>
        <p className="text-xs text-zinc-500">
          {new Intl.DateTimeFormat("et-EE", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(match.kickoff_at))}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <input
          name="home_score"
          type="number"
          min={0}
          max={20}
          required
          defaultValue={match.home_score ?? ""}
          className="w-16 rounded border border-zinc-300 px-2 py-1.5 text-center text-sm"
        />
        <span>:</span>
        <input
          name="away_score"
          type="number"
          min={0}
          max={20}
          required
          defaultValue={match.away_score ?? ""}
          className="w-16 rounded border border-zinc-300 px-2 py-1.5 text-center text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Salvestan…" : "Salvesta tulemus"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="w-full text-sm text-emerald-700">{state.success}</p>
      )}
    </form>
  );
}
