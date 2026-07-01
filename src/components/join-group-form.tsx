"use client";

import { useActionState, useState } from "react";
import {
  acceptInvitation,
  type GroupActionState,
} from "@/lib/groups/actions";

const initialState: GroupActionState = {};

type JoinGroupFormProps = {
  token: string;
  hasHistory: boolean;
  historyNickname: string | null;
};

export function JoinGroupForm({
  token,
  hasHistory,
  historyNickname,
}: JoinGroupFormProps) {
  const [restoreHistory, setRestoreHistory] = useState<boolean | null>(
    hasHistory ? null : false,
  );
  const [state, formAction, pending] = useActionState(
    acceptInvitation,
    initialState,
  );

  const historyChosen = !hasHistory || restoreHistory !== null;
  const useHistoryNickname = hasHistory && restoreHistory === true;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input
        type="hidden"
        name="restore_history"
        value={restoreHistory === null ? "" : restoreHistory ? "true" : "false"}
      />

      {hasHistory && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-950">
            Leidsime sinu varasema ajaloo selles grupis
          </p>
          <p className="mt-1 text-sm text-amber-900">
            Varasem hüüdnimi:{" "}
            <span className="font-medium">{historyNickname ?? "—"}</span>
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-start gap-2 text-sm text-amber-950">
              <input
                type="radio"
                name="history_choice"
                checked={restoreHistory === true}
                onChange={() => setRestoreHistory(true)}
                className="mt-0.5"
              />
              <span>
                Taasta varasem ajalugu (ennustused ja hüüdnimi ajaloost)
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-amber-950">
              <input
                type="radio"
                name="history_choice"
                checked={restoreHistory === false}
                onChange={() => setRestoreHistory(false)}
                className="mt-0.5"
              />
              <span>Alusta nullist (vana ajalugu kustutatakse)</span>
            </label>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
          Sinu hüüdnimi grupis
        </label>
        <input
          id="nickname"
          key={useHistoryNickname ? "history-nickname" : "new-nickname"}
          name="nickname"
          type="text"
          required
          minLength={2}
          placeholder="nt. Mart"
          defaultValue={useHistoryNickname ? (historyNickname ?? "") : ""}
          readOnly={useHistoryNickname}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2 read-only:bg-zinc-100 read-only:text-zinc-600"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {useHistoryNickname
            ? "Taastamisel kasutatakse ajaloo hüüdnime."
            : "Seda nime näevad teised mängijad edetabelis."}
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !historyChosen}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Liitun…" : "Liitu grupiga"}
      </button>
    </form>
  );
}
