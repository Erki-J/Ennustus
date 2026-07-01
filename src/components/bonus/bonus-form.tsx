"use client";

import { useActionState } from "react";
import {
  saveBonusPredictions,
  type BonusActionState,
} from "@/lib/bonus/actions";
import { BonusTeamSelect } from "@/components/bonus/bonus-team-select";
import { useLocale, useTranslations } from "@/lib/i18n/provider";
import { translateTeamName } from "@/lib/i18n/teams";
import type { BonusQuestionWithPrediction } from "@/lib/bonus/queries";
import {
  getTeamOptionsForQuestion,
  type BonusTeamOptions,
} from "@/lib/bonus/team-options";

const initialState: BonusActionState = {};

type BonusFormProps = {
  groupId: string;
  locked: boolean;
  bonusPoints: number;
  teamOptions: BonusTeamOptions;
  groupWinners: BonusQuestionWithPrediction[];
  tournamentWinner?: BonusQuestionWithPrediction;
  topScorer?: BonusQuestionWithPrediction;
  semifinalists: BonusQuestionWithPrediction[];
};

function BonusField({
  question,
  locked,
  bonusPoints,
  teamOptions,
}: {
  question: BonusQuestionWithPrediction;
  locked: boolean;
  bonusPoints: number;
  teamOptions: BonusTeamOptions;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const options = getTeamOptionsForQuestion(question, teamOptions);

  if (locked) {
    return (
      <div className="rounded-lg bg-zinc-50 px-3 py-2">
        <p className="text-sm font-medium text-zinc-900">
          {question.my_answer
            ? translateTeamName(question.my_answer, locale)
            : t("common.dash")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">
        {question.label}{" "}
        <span className="font-normal text-zinc-400">({bonusPoints} p)</span>
      </label>
      <BonusTeamSelect
        name={`question_${question.id}`}
        options={options}
        defaultValue={question.my_answer}
      />
    </div>
  );
}

export function BonusForm({
  groupId,
  locked,
  bonusPoints,
  teamOptions,
  groupWinners,
  tournamentWinner,
  topScorer,
  semifinalists,
}: BonusFormProps) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    saveBonusPredictions,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="group_id" value={groupId} />

      {locked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("bonus.locked")}
        </p>
      )}

      <section className="space-y-3">
        <h3 className="font-medium text-zinc-900">{t("bonus.groupWinners")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {groupWinners.map((question) => (
            <BonusField
              key={question.id}
              question={question}
              locked={locked}
              bonusPoints={bonusPoints}
              teamOptions={teamOptions}
            />
          ))}
        </div>
      </section>

      {tournamentWinner && (
        <section>
          <BonusField
            question={tournamentWinner}
            locked={locked}
            bonusPoints={bonusPoints}
            teamOptions={teamOptions}
          />
        </section>
      )}

      {topScorer && (
        <section>
          <BonusField
            question={topScorer}
            locked={locked}
            bonusPoints={bonusPoints}
            teamOptions={teamOptions}
          />
        </section>
      )}

      {semifinalists.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-medium text-zinc-900">{t("bonus.semifinalists")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {semifinalists.map((question) => (
              <BonusField
                key={question.id}
                question={question}
                locked={locked}
                bonusPoints={bonusPoints}
                teamOptions={teamOptions}
              />
            ))}
          </div>
        </section>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      )}

      {!locked && (
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? t("common.saving") : t("bonus.saveBonus")}
        </button>
      )}
    </form>
  );
}
