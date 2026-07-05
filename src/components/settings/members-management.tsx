"use client";

import { useState } from "react";
import { useActionState } from "react";
import { InviteForm } from "@/components/invite-form";
import { RemoveMemberButton } from "@/components/remove-member-button";
import {
  addManagedGroupMember,
  type GroupActionState,
} from "@/lib/groups/actions";
import { useTranslations } from "@/lib/i18n/provider";

const initialState: GroupActionState = {};

type MemberRow = {
  id: string;
  user_id: string;
  nickname: string;
  role: "admin" | "member";
  is_managed: boolean;
};

type SettingsMembersManagementProps = {
  groupId: string;
  groupName: string;
  tournamentName: string;
  currentUserId: string;
  members: MemberRow[];
  invitations: Array<{
    id: string;
    email: string;
    token: string;
    status: string;
    expires_at: string;
  }>;
};

export function SettingsMembersManagement({
  groupId,
  groupName,
  tournamentName,
  currentUserId,
  members,
  invitations,
}: SettingsMembersManagementProps) {
  const t = useTranslations();
  const [mode, setMode] = useState<"email" | "managed">("email");
  const [managedState, managedAction, managedPending] = useActionState(
    addManagedGroupMember,
    initialState,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">{t("settingsMembers.title")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("settingsMembers.subtitle")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "email"
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                : "nav-link-inactive"
            }`}
          >
            {t("settingsMembers.modeEmail")}
          </button>
          <button
            type="button"
            onClick={() => setMode("managed")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "managed"
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                : "nav-link-inactive"
            }`}
          >
            {t("settingsMembers.modeManaged")}
          </button>
        </div>

        <div className="mt-6">
          {mode === "email" ? (
            <InviteForm
              groupId={groupId}
              groupName={groupName}
              tournamentName={tournamentName}
              invitations={invitations}
            />
          ) : (
            <form action={managedAction} className="space-y-4">
              <input type="hidden" name="group_id" value={groupId} />
              <div>
                <label htmlFor="managed-nickname" className="mb-1 block text-sm font-medium">
                  {t("settingsMembers.managedNickname")}
                </label>
                <input
                  id="managed-nickname"
                  name="nickname"
                  type="text"
                  required
                  minLength={2}
                  placeholder={t("settingsMembers.managedNicknamePlaceholder")}
                  className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  {t("settingsMembers.managedHint")}
                </p>
              </div>

              {managedState.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {managedState.error}
                </p>
              )}

              {managedState.success && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {managedState.success}
                </p>
              )}

              <button
                type="submit"
                disabled={managedPending}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {managedPending
                  ? t("settingsMembers.managedAdding")
                  : t("settingsMembers.managedAdd")}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">
          {t("group.members", { count: members.length })}
        </h2>
        <ul className="mt-4 space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-zinc-900">
                {member.nickname}
                {member.user_id === currentUserId && (
                  <span className="ml-2 font-normal text-zinc-500">
                    ({t("common.you")})
                  </span>
                )}
                {member.is_managed && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-800">
                    {t("settingsMembers.managedBadge")}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">
                  {member.role === "admin" ? t("common.admin") : t("common.player")}
                </span>
                {member.role !== "admin" && member.user_id !== currentUserId && (
                  <RemoveMemberButton
                    groupId={groupId}
                    userId={member.user_id}
                    nickname={member.nickname}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
