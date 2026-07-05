"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fillManagedMemberPredictionsAction,
  type GroupActionState,
} from "@/lib/groups/actions";
import { useTranslations } from "@/lib/i18n/provider";

const initialState: GroupActionState = {};

export function FillManagedPredictionsButton({
  groupId,
  userId,
  nickname,
}: {
  groupId: string;
  userId: string;
  nickname: string;
}) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    fillManagedMemberPredictionsAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        disabled={pending}
        title={nickname}
        className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
      >
        {pending ? t("settingsMembers.fillingPredictions") : t("settingsMembers.fillPredictions")}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-red-600">{state.error}</span>
      )}
      {state.success && (
        <span className="ml-2 text-xs text-emerald-700">{state.success}</span>
      )}
    </form>
  );
}
