"use client";

import { useActionState } from "react";
import {
  saveMyPrediction,
  type PredictionCentreActionState,
} from "@/lib/prediction-centre/actions";
import { formatDateTime } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/provider";
import { formatMatchTeams } from "@/lib/i18n/teams";
import { formatMatchScore } from "@/lib/scoring/calculate";
import { isKnockoutStage } from "@/lib/scoring/knockout-score";
import { getMatchResultColorClass } from "@/lib/ui/match-result";
import type { MatchWithPrediction } from "@/lib/prediction-centre/queries";

const initialState: PredictionCentreActionState = {};

type PredictionCentreMatchRowProps = {
  groupId: string;
  match: MatchWithPrediction;
};

export function PredictionCentreMatchRow({
  groupId,
  match,
}: PredictionCentreMatchRowProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(saveMyPrediction, initialState);

  const defaultHome = match.my_prediction?.home_goals ?? "";
  const defaultAway = match.my_prediction?.away_goals ?? "";

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-3 py-4 align-top">
        {match.group_code && (
          <p className="text-xs uppercase text-zinc-400">
            {t("predictionCentre.groupCode", { code: match.group_code })}
          </p>
        )}
        <p className={`font-medium text-zinc-900 ${match.group_code ? "mt-1" : ""}`}>
          {formatMatchTeams(match.home_team, match.away_team, locale)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {formatDateTime(match.kickoff_at, locale)}
        </p>
        {(match.home_score !== null && match.away_score !== null) ||
        match.status === "live" ? (
          <p
            className={`mt-1 text-xs font-medium ${getMatchResultColorClass(match.status)}`}
          >
            {t("predictionCentre.resultLabel")}{" "}
            {formatMatchScore(match.home_score, match.away_score)}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-4 align-top">
        {match.locked ? (
          <div>
            <p className="text-lg font-semibold text-zinc-900">
              {match.my_prediction
                ? `${match.my_prediction.home_goals}:${match.my_prediction.away_goals}`
                : t("common.dash")}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {t("predictionCentre.lockedPoints", {
                points: match.my_prediction?.points ?? 0,
              })}
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
                {pending ? t("common.saving") : t("common.save")}
              </button>
            </div>
            {isKnockoutStage(match.stage) && (
              <div className="space-y-0.5">
                <p className="text-xs text-amber-700">{t("predictionCentre.knockoutDrawHint")}</p>
                <p className="text-xs text-amber-700">{t("predictionCentre.knockoutScoreHint")}</p>
              </div>
            )}
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
