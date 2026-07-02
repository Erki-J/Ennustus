import type { MatchStatus } from "@/types/database";
import type { MatchProgressInput } from "@/lib/matches/in-progress";
import { getEffectiveMatchStatus } from "@/lib/matches/in-progress";

export function getMatchResultColorClass(
  status: MatchStatus,
  match?: MatchProgressInput,
  now = Date.now(),
): string {
  const effectiveStatus = match ? getEffectiveMatchStatus(match, now) : status;

  if (effectiveStatus === "live") {
    return "text-red-600";
  }

  if (effectiveStatus === "finished") {
    return "text-emerald-700";
  }

  return "text-zinc-500";
}
