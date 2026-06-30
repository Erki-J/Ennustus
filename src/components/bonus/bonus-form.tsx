"use client";

import { useActionState } from "react";
import {
  saveBonusPredictions,
  type BonusActionState,
} from "@/lib/bonus/actions";
import type { BonusQuestionWithPrediction } from "@/lib/bonus/queries";

const initialState: BonusActionState = {};

type BonusFormProps = {
  groupId: string;
  locked: boolean;
  bonusPoints: number;
  groupWinners: BonusQuestionWithPrediction[];
  tournamentWinner?: BonusQuestionWithPrediction;
  topScorer?: BonusQuestionWithPrediction;
  semifinalists: BonusQuestionWithPrediction[];
};

function BonusField({
  question,
  locked,
  bonusPoints,
}: {
  question: BonusQuestionWithPrediction;
  locked: boolean;
  bonusPoints: number;
}) {
  if (locked) {
    return (
      <div className="rounded-lg bg-zinc-50 px-3 py-2">
        <p className="text-sm font-medium text-zinc-900">
          {question.my_answer ?? "—"}
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
      <input
        name={`question_${question.id}`}
        type="text"
        defaultValue={question.my_answer ?? ""}
        placeholder="Meeskond või mängija"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

export function BonusForm({
  groupId,
  locked,
  bonusPoints,
  groupWinners,
  tournamentWinner,
  topScorer,
  semifinalists,
}: BonusFormProps) {
  const [state, formAction, pending] = useActionState(
    saveBonusPredictions,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="group_id" value={groupId} />

      {locked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Boonused on lukustatud — turniiri esimene mäng on alanud.
        </p>
      )}

      <section className="space-y-3">
        <h3 className="font-medium text-zinc-900">Grupivõitjad</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {groupWinners.map((question) => (
            <BonusField
              key={question.id}
              question={question}
              locked={locked}
              bonusPoints={bonusPoints}
            />
          ))}
        </div>
      </section>

      {tournamentWinner && (
        <section>
          <BonusField question={tournamentWinner} locked={locked} bonusPoints={bonusPoints} />
        </section>
      )}

      {topScorer && (
        <section>
          <BonusField question={topScorer} locked={locked} bonusPoints={bonusPoints} />
        </section>
      )}

      {semifinalists.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-medium text-zinc-900">4 poolfinaalisti</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {semifinalists.map((question) => (
              <BonusField
                key={question.id}
                question={question}
                locked={locked}
                bonusPoints={bonusPoints}
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
          {pending ? "Salvestan…" : "Salvesta boonused"}
        </button>
      )}
    </form>
  );
}
