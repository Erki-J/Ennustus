import type { CronSettings, Match } from "@/types/database";

export function getMatchSyncWindow(
  match: Pick<Match, "kickoff_at">,
  cron: Pick<
    CronSettings,
    "window_start" | "match_duration_minutes" | "window_end_offset_minutes"
  >,
) {
  const kickoffMs = new Date(match.kickoff_at).getTime();
  const startMs =
    cron.window_start === "kickoff" ? kickoffMs : kickoffMs;
  const estimatedEndMs =
    kickoffMs + cron.match_duration_minutes * 60_000;
  const endMs = estimatedEndMs + cron.window_end_offset_minutes * 60_000;

  return {
    startMs,
    endMs,
    startAt: new Date(startMs),
    endAt: new Date(endMs),
  };
}

export function isMatchInSyncWindow(
  match: Pick<Match, "kickoff_at">,
  cron: Pick<
    CronSettings,
    "window_start" | "match_duration_minutes" | "window_end_offset_minutes"
  >,
  now = Date.now(),
) {
  const { startMs, endMs } = getMatchSyncWindow(match, cron);
  return now >= startMs && now <= endMs;
}

export function countMatchesInSyncWindow(
  matches: Pick<Match, "kickoff_at">[],
  cron: Pick<
    CronSettings,
    "window_start" | "match_duration_minutes" | "window_end_offset_minutes"
  >,
  now = Date.now(),
) {
  return matches.filter((match) => isMatchInSyncWindow(match, cron, now)).length;
}

export function shouldRunCronNow(
  cron: CronSettings,
  activeMatches: number,
  now = Date.now(),
) {
  if (!cron.enabled || activeMatches === 0) {
    return false;
  }

  if (!cron.last_run_at) {
    return true;
  }

  const lastRunMs = new Date(cron.last_run_at).getTime();
  const intervalMs = cron.interval_minutes * 60_000;
  return now - lastRunMs >= intervalMs;
}
