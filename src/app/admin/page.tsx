import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlatformOverview } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminPage() {
  const { locale, t } = await getI18n();
  const overview = await getPlatformOverview();

  if (!overview) {
    notFound();
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">{t("platformAdmin.userCount")}</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">
            {overview.userCount}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">{t("platformAdmin.groupCount")}</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">
            {overview.groupCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">{t("platformAdmin.usersTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("platformAdmin.usersHint")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">{t("common.name")}</th>
                <th className="px-3 py-2 font-medium">{t("auth.email")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.role")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.registered")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.memberOf")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.groupsCreated")}</th>
              </tr>
            </thead>
            <tbody>
              {overview.users.map((user) => (
                <tr key={user.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium text-zinc-900">
                    {user.display_name ?? t("common.dash")}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{user.email}</td>
                  <td className="px-3 py-2 text-zinc-700">
                    {user.role === "admin"
                      ? t("platformAdmin.platformAdmin")
                      : t("common.player")}
                  </td>
                  <td className="px-3 py-2 text-zinc-600">
                    {formatDateTime(user.created_at, locale)}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{user.group_count}</td>
                  <td className="px-3 py-2 text-zinc-700">{user.groups_created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">{t("platformAdmin.groupsTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("platformAdmin.groupsHint")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">{t("group.groupName")}</th>
                <th className="px-3 py-2 font-medium">{t("common.tournament")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.createdBy")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.createdAt")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.members")}</th>
                <th className="px-3 py-2 font-medium">{t("platformAdmin.openGroup")}</th>
              </tr>
            </thead>
            <tbody>
              {overview.groups.map((group) => (
                <tr key={group.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium text-zinc-900">{group.name}</td>
                  <td className="px-3 py-2 text-zinc-700">{group.tournament_name}</td>
                  <td className="px-3 py-2 text-zinc-700">
                    <span className="block font-medium">
                      {group.creator_name ?? group.creator_email}
                    </span>
                    {group.creator_name && (
                      <span className="text-xs text-zinc-500">{group.creator_email}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-600">
                    {formatDateTime(group.created_at, locale)}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{group.member_count}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/groups/${group.id}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {t("platformAdmin.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
