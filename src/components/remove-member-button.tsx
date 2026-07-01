"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeGroupMember,
  type GroupActionState,
} from "@/lib/groups/actions";

const initialState: GroupActionState = {};

export function RemoveMemberButton({
  groupId,
  userId,
  nickname,
}: {
  groupId: string;
  userId: string;
  nickname: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(removeGroupMember, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        Kustuta
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-member-title"
          >
            <h3 id="remove-member-title" className="text-lg font-semibold text-zinc-900">
              Kustuta mängija?
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Kas oled kindel, et soovid mängija{" "}
              <span className="font-medium text-zinc-900">{nickname}</span> grupist
              eemaldada?
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Tema ennustused salvestatakse ajaloo. Kui sama e-mailiga hiljem uuesti
              liitutakse, saab valida, kas taastada varasem seis.
            </p>

            {state.error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="btn-secondary px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Tühista
              </button>
              <form action={formAction}>
                <input type="hidden" name="group_id" value={groupId} />
                <input type="hidden" name="user_id" value={userId} />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? "Kustutan…" : "Jah, kustuta"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
