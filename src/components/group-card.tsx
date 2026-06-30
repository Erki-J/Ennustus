import Link from "next/link";
import type { GroupWithMeta } from "@/types/database";

export function GroupCard({ group }: { group: GroupWithMeta }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-900">{group.name}</p>
          <p className="mt-1 text-sm text-zinc-500">{group.tournament.name}</p>
        </div>
        {group.my_role === "admin" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Admin
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        Sina: {group.my_nickname} · {group.member_count} mängijat
      </p>
    </Link>
  );
}
