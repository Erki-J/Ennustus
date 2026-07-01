"use client";

import { useActionState } from "react";
import {
  revokeInvitation,
  type GroupActionState,
} from "@/lib/groups/actions";
import { useTranslations } from "@/lib/i18n/provider";

const initialState: GroupActionState = {};

type InviteRevokeFormProps = {
  groupId: string;
  invitationId: string;
};

export function InviteRevokeForm({ groupId, invitationId }: InviteRevokeFormProps) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(revokeInvitation, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="invitation_id" value={invitationId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-white px-3 py-1.5 text-sm text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "…" : t("common.delete")}
      </button>
      {state.error && (
        <p className="mt-2 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
