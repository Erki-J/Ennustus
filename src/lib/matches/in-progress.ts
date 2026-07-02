import { DEFAULT_CRON_SETTINGS } from "@/lib/cron/settings";
import type { Match, MatchStatus } from "@/types/database";

export type MatchProgressInput = Pick<Match, "kickoff_at" | "status">;

export const LIVE_MATCH_BG_CLASS = "bg-emerald-50";

export function isMatchInProgress(
  match: MatchProgressInput,
  now = Date.now(),
  matchDurationMinutes = DEFAULT_CRON_SETTINGS.match_duration_minutes,
): boolean {
  if (match.status === "finished") {
    return false;
  }

  if (match.status === "live") {
    return true;
  }

  const kickoffMs = new Date(match.kickoff_at).getTime();
  if (now < kickoffMs) {
    return false;
  }

  const estimatedEndMs = kickoffMs + matchDurationMinutes * 60_000;
  return now <= estimatedEndMs;
}

export function getEffectiveMatchStatus(
  match: MatchProgressInput,
  now = Date.now(),
): MatchStatus {
  if (match.status === "finished") {
    return "finished";
  }

  if (isMatchInProgress(match, now)) {
    return "live";
  }

  return match.status;
}
