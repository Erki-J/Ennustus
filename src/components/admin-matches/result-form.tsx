import { saveMatchResult } from "@/lib/admin-matches/actions";
import type { Match } from "@/types/database";

export function AdminMatchResultForm({
  groupId,
  roundKey,
  match,
}: {
  groupId: string;
  roundKey: string;
  match: Match;
}) {
  const kickoffLabel = new Intl.DateTimeFormat("et-EE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(match.kickoff_at));

  return (
    <form
      action={saveMatchResult}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4"
    >
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="round_key" value={roundKey} />
      <input type="hidden" name="match_id" value={match.id} />
      <div className="min-w-48 flex-1">
        <p className="font-medium text-zinc-900">
          {match.home_team} – {match.away_team}
        </p>
        <p className="text-xs text-zinc-500">{kickoffLabel}</p>
      </div>
      <div className="flex items-center gap-1">
        <input
          name="home_score"
          type="number"
          min={0}
          max={20}
          required
          defaultValue={match.home_score ?? undefined}
          className="w-16 rounded border border-zinc-300 px-2 py-1.5 text-center text-sm"
        />
        <span>:</span>
        <input
          name="away_score"
          type="number"
          min={0}
          max={20}
          required
          defaultValue={match.away_score ?? undefined}
          className="w-16 rounded border border-zinc-300 px-2 py-1.5 text-center text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Salvesta tulemus
      </button>
    </form>
  );
}
