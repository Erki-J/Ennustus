import type { MatchStatus } from "@/types/database";

export function getMatchResultColorClass(status: MatchStatus): string {
  if (status === "live") {
    return "text-red-600";
  }

  if (status === "finished") {
    return "text-emerald-700";
  }

  return "text-zinc-500";
}
