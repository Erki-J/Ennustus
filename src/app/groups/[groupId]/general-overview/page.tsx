import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { getGroupContext } from "@/lib/groups/context";
import { getGeneralOverview } from "@/lib/general-overview/queries";
import { OWN_ROW_CLASS } from "@/lib/ui/highlight";

type GeneralOverviewPageProps = {
  params: Promise<{ groupId: string }>;
};

function columnMaxima(rows: { round_points: number[] }[], columnCount: number) {
  const maxima: number[] = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    let max = 0;
    for (const row of rows) {
      max = Math.max(max, row.round_points[columnIndex] ?? 0);
    }
    maxima.push(max);
  }

  return maxima;
}

export default async function GeneralOverviewPage({
  params,
}: GeneralOverviewPageProps) {
  const { groupId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const context = await getGroupContext(groupId);

  if (!context) {
    notFound();
  }

  const { columns, rows } = await getGeneralOverview(groupId);
  const maxima = columnMaxima(rows, columns.length);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-4">
        <h2 className="font-semibold text-zinc-900">Üldine ülevaade</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Mängupäevade punktid rea kaupa — nagu Kicktippi „General overview”.
        </p>
        <p className="mt-3 inline-block rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700">
          Mängupäevade punktid
        </p>
      </div>

      {columns.length === 0 ? (
        <p className="px-6 py-8 text-sm text-zinc-500">Mänge pole lisatud.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="sticky left-0 bg-zinc-50 px-3 py-2 font-medium">Pos</th>
                <th className="sticky left-10 bg-zinc-50 px-3 py-2 font-medium">Nimi</th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-2 py-2 text-center font-medium"
                    title={column.header}
                  >
                    {column.header}
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-medium" title="Boonus">
                  B
                </th>
                <th className="px-3 py-2 text-right font-medium">T</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.user_id}
                  className={`border-t border-zinc-100 ${
                    row.user_id === context.userId ? OWN_ROW_CLASS : ""
                  }`}
                >
                  <td className="sticky left-0 bg-inherit px-3 py-2">{index + 1}</td>
                  <td className="sticky left-10 bg-inherit px-3 py-2 font-medium">
                    {row.nickname}
                  </td>
                  {row.round_points.map((points, columnIndex) => {
                    const isBest =
                      points > 0 && points === maxima[columnIndex] && maxima[columnIndex] > 0;

                    return (
                      <td
                        key={columns[columnIndex].key}
                        className={`px-2 py-2 text-center ${
                          isBest
                            ? "font-bold text-red-600"
                            : points > 0
                              ? "text-zinc-900"
                              : "text-zinc-300"
                        }`}
                      >
                        {points > 0 ? points : "·"}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-semibold text-zinc-900">
                    {row.bonus_points}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{row.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
