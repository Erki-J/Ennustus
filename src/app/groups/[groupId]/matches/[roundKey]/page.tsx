import { notFound } from "next/navigation";
import { AdminMatchResultForm } from "@/components/admin-matches/result-form";
import { MatchdayNav } from "@/components/matchday-nav";
import { getI18n } from "@/lib/i18n/server";
import { getGroupMatchdays } from "@/lib/matchdays/queries";

type MatchesRoundPageProps = {
  params: Promise<{ groupId: string; roundKey: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function MatchesRoundPage({
  params,
  searchParams,
}: MatchesRoundPageProps) {
  const { locale, t } = await getI18n();
  const { groupId, roundKey } = await params;
  const { error, success } = await searchParams;
  const { rounds } = await getGroupMatchdays(groupId, locale);
  const round = rounds.find((item) => item.key === roundKey);

  if (!round) {
    notFound();
  }

  const matches = [...round.matches].sort((a, b) =>
    a.kickoff_at.localeCompare(b.kickoff_at),
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold text-zinc-900">
            {t("admin.roundTitle", { round: round.label })}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">{t("admin.enterResults")}</p>
        </div>
        <MatchdayNav
          basePath={`/groups/${groupId}/matches`}
          rounds={rounds}
          currentKey={round.key}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("admin.noMatchesRound")}</p>
        ) : (
          matches.map((match) => (
            <AdminMatchResultForm
              key={match.id}
              groupId={groupId}
              roundKey={round.key}
              match={match}
            />
          ))
        )}
      </div>
    </section>
  );
}
