"use client";

import { useActionState } from "react";
import {
  saveMyPrediction,
  type PredictionCentreActionState,
} from "@/lib/prediction-centre/actions";
import { formatMatchScore } from "@/lib/scoring/calculate";
import type { MatchWithPrediction } from "@/lib/prediction-centre/queries";

const initialState: PredictionCentreActionState = {};

type PredictionCentreMatchRowProps = {
  groupId: string;
  match: MatchWithPrediction;
};

function formatKickoff(kickoffAt: string) {
  return new Intl.DateTimeFormat("et-EE", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(kickoffAt));
}

export function PredictionCentreMatchRow({
  groupId,
  match,
}: PredictionCentreMatchRowProps) {
  const [state, formAction, pending] = useActionState(saveMyPrediction, initialState);

  const defaultHome = match.my_prediction?.home_goals ?? "";
  const defaultAway = match.my_prediction?.away_goals ?? "";

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-3 py-4 align-top">
        {match.group_code && (
          <p className="text-xs uppercase text-zinc-400">Grupp {match.group_code}</p>
        )}
        <p className={`font-medium text-zinc-900 ${match.group_code ? "mt-1" : ""}`}>
          {match.home_team} – {match.away_team}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{formatKickoff(match.kickoff_at)}</p>
        {match.home_score !== null && match.away_score !== null && (
          <p className="mt-1 text-xs font-medium text-emerald-700">
            Tulemus: {formatMatchScore(match.home_score, match.away_score)}
          </p>
        )}
      </td>
      <td className="px-3 py-4 align-top">
        {match.locked ? (
          <div>
            <p className="text-lg font-semibold text-zinc-900">
              {match.my_prediction
                ? `${match.my_prediction.home_goals}:${match.my_prediction.away_goals}`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Lukus · {match.my_prediction?.points ?? 0} p
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="group_id" value={groupId} />
            <input type="hidden" name="match_id" value={match.id} />
            <div className="flex items-center gap-2">
              <input
                name="home_goals"
                type="number"
                min={0}
                max={20}
                required
                defaultValue={defaultHome}
                className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm"
              />
              <span className="text-zinc-400">:</span>
              <input
                name="away_goals"
                type="number"
                min={0}
                max={20}
                required
                defaultValue={defaultAway}
                className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {pending ? "Salvestan…" : "Salvesta"}
              </button>
            </div>
            {state.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
            {state.success && (
              <p className="text-xs text-emerald-700">{state.success}</p>
            )}
          </form>
        )}
      </td>
    </tr>
  );
}
