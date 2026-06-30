"use client";

import { useActionState } from "react";
import {
  acceptInvitation,
  type GroupActionState,
} from "@/lib/groups/actions";

const initialState: GroupActionState = {};

type JoinGroupFormProps = {
  token: string;
};

export function JoinGroupForm({ token }: JoinGroupFormProps) {
  const [state, formAction, pending] = useActionState(
    acceptInvitation,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
          Sinu hüüdnimi grupis
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          placeholder="nt. Mart"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Seda nime näevad teised mängijad edetabelis.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Liitun…" : "Liitu grupiga"}
      </button>
    </form>
  );
}
