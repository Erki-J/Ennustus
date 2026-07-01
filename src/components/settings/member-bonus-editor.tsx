"use client";

import { useActionState } from "react";
import { adminSaveMemberBonus, type BonusActionState } from "@/lib/bonus/actions";
import { BonusTeamSelect } from "@/components/bonus/bonus-team-select";
import { useTranslations } from "@/lib/i18n/provider";
import type { BonusQuestion } from "@/lib/bonus/queries";
import {
  getTeamOptionsForQuestion,
  type BonusTeamOptions,
} from "@/lib/bonus/team-options";

const initialState: BonusActionState = {};

type SettingsMemberBonusEditorProps = {
  groupId: string;
  userId: string;
  question: BonusQuestion;
  answer: string | null;
  bonusPoints: number;
  teamOptions: BonusTeamOptions;
};

export function SettingsMemberBonusEditor({
  groupId,
  userId,
  question,
  answer,
  bonusPoints,
  teamOptions,
}: SettingsMemberBonusEditorProps) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    adminSaveMemberBonus,
    initialState,
  );
  const options = getTeamOptionsForQuestion(question, teamOptions);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-lg bg-zinc-50 p-3">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="question_id" value={question.id} />
      <div className="min-w-48 flex-1">
        <p className="text-sm font-medium text-zinc-800">{question.label}</p>
        <p className="text-xs text-zinc-500">
          {t("bonus.pointsValue", { points: bonusPoints })}
        </p>
      </div>
      <div className="min-w-48 flex-1 sm:flex-none">
        <BonusTeamSelect
          name="answer"
          options={options}
          defaultValue={answer}
          placeholder={t("bonus.selectAnswer")}
          required
          className="w-full min-w-40 rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "…" : t("common.save")}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="w-full text-xs text-emerald-700">{state.success}</p>
      )}
    </form>
  );
}
