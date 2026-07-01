"use client";

import { useActionState } from "react";
import {
  buildInviteUrl,
  buildMailtoLink,
} from "@/lib/groups/invite-links";
import { InviteRevokeForm } from "@/components/invite-revoke-form";
import {
  inviteToGroup,
  type GroupActionState,
} from "@/lib/groups/actions";

const initialState: GroupActionState = {};

type InviteFormProps = {
  groupId: string;
  groupName: string;
  invitations: Array<{
    id: string;
    email: string;
    token: string;
    status: string;
    expires_at: string;
  }>;
};

export function InviteForm({ groupId, groupName, invitations }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(inviteToGroup, initialState);

  const pendingInvites = invitations.filter(
    (invite) => invite.status === "pending",
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="group_id" value={groupId} />
        <div>
          <label htmlFor="emails" className="mb-1 block text-sm font-medium">
            Kutsu mängijaid e-mailiga
          </label>
          <textarea
            id="emails"
            name="emails"
            rows={3}
            required
            placeholder="üks e-mail rea kohta või komaga eraldatult"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Iga kutsutu saab lingi. Saada e-kiri nupuga „Saada e-mail” või kopeeri link.
          </p>
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        {state.success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {state.success}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Loon kutsed…" : "Loo kutsed"}
        </button>
      </form>

      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-700">Ootel kutsed</p>
          {pendingInvites.map((invite) => {
            const inviteUrl = buildInviteUrl(invite.token);
            const mailto = buildMailtoLink(invite.email, groupName, inviteUrl);

            return (
              <div
                key={invite.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm"
              >
                <p className="font-medium text-zinc-900">{invite.email}</p>
                <p className="mt-2 break-all text-zinc-600">{inviteUrl}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={mailto}
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                  >
                    Saada e-mail
                  </a>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(inviteUrl)}
                    className="btn-secondary px-3 py-1.5 text-sm ring-1 ring-zinc-200"
                  >
                    Kopeeri link
                  </button>
                  <InviteRevokeForm groupId={groupId} invitationId={invite.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
