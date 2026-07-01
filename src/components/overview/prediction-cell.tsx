import {
  getMatchPredictionCellDisplay,
  type MatchPredictionCell,
} from "@/lib/predictions/display";

type OverviewPredictionCellProps = {
  cell: MatchPredictionCell;
  matchStarted: boolean;
};

export function OverviewPredictionCell({
  cell,
  matchStarted,
}: OverviewPredictionCellProps) {
  const display = getMatchPredictionCellDisplay(cell, matchStarted);

  if (display.kind === "empty") {
    return null;
  }

  if (display.kind === "hidden") {
    return <span className="font-medium text-zinc-900">—</span>;
  }

  return (
    <span className="text-zinc-900">
      {display.home_goals}-{display.away_goals}
      {display.points > 0 && (
        <sub className="ml-0.5 font-semibold text-emerald-700">{display.points}</sub>
      )}
    </span>
  );
}
