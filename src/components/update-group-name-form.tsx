"use client";

import { useActionState } from "react";
import {
  updateGroupName,
  type GroupActionState,
} from "@/lib/groups/actions";
import { useTranslations } from "@/lib/i18n/provider";

const initialState: GroupActionState = {};

type UpdateGroupNameFormProps = {
  groupId: string;
  name: string;
};

export function UpdateGroupNameForm({ groupId, name }: UpdateGroupNameFormProps) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(updateGroupName, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="group_id" value={groupId} />
      <div className="min-w-48 flex-1">
        <label htmlFor="group_name" className="mb-1 block text-sm font-medium text-zinc-700">
          {t("group.groupName")}
        </label>
        <input
          id="group_name"
          name="name"
          type="text"
          required
          minLength={2}
          defaultValue={name}
          placeholder={t("group.groupNamePlaceholder")}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
        />
        <p className="mt-1 text-xs text-zinc-500">{t("group.groupNameHint")}</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? t("common.saving") : t("common.save")}
      </button>
      {state.error && (
        <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="w-full rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      )}
    </form>
  );
}
