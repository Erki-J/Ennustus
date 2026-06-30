"use client";

import { useActionState } from "react";
import {
  createPredictionGroup,
  type GroupActionState,
} from "@/lib/groups/actions";
import type { Tournament } from "@/types/database";

const initialState: GroupActionState = {};

type CreateGroupFormProps = {
  tournaments: Tournament[];
};

export function CreateGroupForm({ tournaments }: CreateGroupFormProps) {
  const [state, formAction, pending] = useActionState(
    createPredictionGroup,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="tournament_id" className="mb-1 block text-sm font-medium">
          Turniir
        </label>
        <select
          id="tournament_id"
          name="tournament_id"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
        >
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Grupi nimi
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="nt. Töökaaslased, Perekond"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
          Sinu hüüdnimi selles grupis
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          placeholder="nt. Erki"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Grupi admin — saad kutsuda teisi ja hallata seadeid.
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
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Loon gruppi…" : "Loo ennustusgrupp"}
      </button>
    </form>
  );
}
