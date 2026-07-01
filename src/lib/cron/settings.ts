import type { CronSettings } from "@/types/database";

export const DEFAULT_CRON_SETTINGS: CronSettings = {
  enabled: false,
  interval_minutes: 5,
  window_start: "kickoff",
  match_duration_minutes: 105,
  window_end_offset_minutes: 60,
  last_run_at: null,
};

export function parseCronSettings(raw: unknown): CronSettings {
  const value = (raw ?? {}) as Partial<CronSettings>;

  const readInt = (input: unknown, fallback: number) => {
    const parsed =
      typeof input === "number"
        ? input
        : typeof input === "string"
          ? Number(input)
          : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    enabled: Boolean(value.enabled),
    interval_minutes: Math.max(
      1,
      readInt(value.interval_minutes, DEFAULT_CRON_SETTINGS.interval_minutes),
    ),
    window_start: "kickoff",
    match_duration_minutes: readInt(
      value.match_duration_minutes,
      DEFAULT_CRON_SETTINGS.match_duration_minutes,
    ),
    window_end_offset_minutes: readInt(
      value.window_end_offset_minutes,
      DEFAULT_CRON_SETTINGS.window_end_offset_minutes,
    ),
    last_run_at:
      typeof value.last_run_at === "string" ? value.last_run_at : null,
  };
}
