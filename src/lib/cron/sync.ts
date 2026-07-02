import { syncTournamentBonusResults } from "@/lib/cron/bonus/sync-bonus";
import { parseCronSettings } from "@/lib/cron/settings";
import { syncTournamentScores } from "@/lib/cron/scores/sync-scores";
import {
  countMatchesInSyncWindow,
  isMatchInSyncWindow,
  shouldRunCronNow,
} from "@/lib/cron/window";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CronSettings, Match } from "@/types/database";

type TournamentCronConfig = {
  cron: CronSettings;
  groupIds: string[];
};

export type CronSyncResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  groupsChecked: number;
  tournamentsSynced: number;
  matchesInWindow: number;
  matchesUpdated: number;
  scoresUpdated: number;
  bonusUpdated: number;
  details: string[];
};

function mergeTournamentCron(
  current: TournamentCronConfig,
  incoming: CronSettings,
  groupId: string,
): TournamentCronConfig {
  const lastRunAt = [current.cron.last_run_at, incoming.last_run_at]
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  return {
    groupIds: [...current.groupIds, groupId],
    cron: {
      ...current.cron,
      enabled: true,
      interval_minutes: Math.min(
        current.cron.interval_minutes,
        incoming.interval_minutes,
      ),
      match_duration_minutes: incoming.match_duration_minutes,
      window_end_offset_minutes: incoming.window_end_offset_minutes,
      last_run_at: lastRunAt,
    },
  };
}

async function syncTournamentMatches(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  tournamentSlug: string,
  allMatches: Match[],
  windowMatches: Match[],
  now = Date.now(),
) {
  let liveUpdated = 0;
  const details: string[] = [];

  for (const match of windowMatches) {
    if (new Date(match.kickoff_at).getTime() > now) {
      continue;
    }

    if (match.status === "finished") {
      continue;
    }

    if (match.status !== "scheduled") {
      continue;
    }

    const { error } = await admin
      .from("matches")
      .update({ status: "live" })
      .eq("id", match.id)
      .eq("status", "scheduled");

    if (error) {
      details.push(`${match.home_team}–${match.away_team}: ${error.message}`);
      continue;
    }

    liveUpdated += 1;
    details.push(`${match.home_team}–${match.away_team}: märgitud live`);
  }

  const scoreResult = await syncTournamentScores(
    admin,
    tournamentSlug,
    allMatches,
    now,
  );

  return {
    liveUpdated,
    scoresUpdated: scoreResult.scoresUpdated,
    details: [...details, ...scoreResult.details],
  };
}

export async function runCronSync(): Promise<CronSyncResult> {
  const admin = createAdminClient();

  if (!admin) {
    return {
      ok: false,
      skipped: true,
      reason: "Admin klient puudub",
      groupsChecked: 0,
      tournamentsSynced: 0,
      matchesInWindow: 0,
      matchesUpdated: 0,
      scoresUpdated: 0,
      bonusUpdated: 0,
      details: ["Lisa SUPABASE_SERVICE_ROLE_KEY ja CRON_SECRET keskkonna muutujatesse."],
    };
  }

  const { data: settingsRows, error: settingsError } = await admin
    .from("group_settings")
    .select("group_id, cron");

  if (settingsError) {
    return {
      ok: false,
      skipped: true,
      reason: settingsError.message,
      groupsChecked: 0,
      tournamentsSynced: 0,
      matchesInWindow: 0,
      matchesUpdated: 0,
      scoresUpdated: 0,
      bonusUpdated: 0,
      details: [settingsError.message],
    };
  }

  const enabledRows = (settingsRows ?? []).filter((row) =>
    parseCronSettings(row.cron).enabled,
  );

  if (enabledRows.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason: "Cron on kõigil gruppidel väljas",
      groupsChecked: 0,
      tournamentsSynced: 0,
      matchesInWindow: 0,
      matchesUpdated: 0,
      scoresUpdated: 0,
      bonusUpdated: 0,
      details: [],
    };
  }

  const groupIds = enabledRows.map((row) => row.group_id);
  const { data: groups, error: groupsError } = await admin
    .from("prediction_groups")
    .select("id, tournament_id")
    .in("id", groupIds);

  if (groupsError) {
    return {
      ok: false,
      skipped: true,
      reason: groupsError.message,
      groupsChecked: enabledRows.length,
      tournamentsSynced: 0,
      matchesInWindow: 0,
      matchesUpdated: 0,
      scoresUpdated: 0,
      bonusUpdated: 0,
      details: [groupsError.message],
    };
  }

  const tournamentByGroup = new Map(
    (groups ?? []).map((group) => [group.id, group.tournament_id]),
  );

  const tournamentMap = new Map<string, TournamentCronConfig>();

  for (const row of enabledRows) {
    const tournamentId = tournamentByGroup.get(row.group_id);
    if (!tournamentId) {
      continue;
    }

    const cron = parseCronSettings(row.cron);
    const existing = tournamentMap.get(tournamentId);

    if (existing) {
      tournamentMap.set(tournamentId, mergeTournamentCron(existing, cron, row.group_id));
    } else {
      tournamentMap.set(tournamentId, { cron, groupIds: [row.group_id] });
    }
  }

  const tournamentIds = [...tournamentMap.keys()];
  const { data: tournaments } = await admin
    .from("tournaments")
    .select("id, slug")
    .in("id", tournamentIds);

  const slugByTournament = new Map(
    (tournaments ?? []).map((tournament) => [tournament.id, tournament.slug]),
  );

  const now = Date.now();
  let tournamentsSynced = 0;
  let totalInWindow = 0;
  let totalLiveUpdated = 0;
  let totalScoresUpdated = 0;
  let totalBonusUpdated = 0;
  const details: string[] = [];

  for (const [tournamentId, config] of tournamentMap) {
    const { data: matches, error: matchesError } = await admin
      .from("matches")
      .select(
        "id, tournament_id, home_team, away_team, kickoff_at, stage, matchday, group_code, sort_order, home_score, away_score, status",
      )
      .eq("tournament_id", tournamentId);

    if (matchesError) {
      details.push(`Turniir ${tournamentId}: ${matchesError.message}`);
      continue;
    }

    const typedMatches = (matches ?? []) as Match[];
    const inWindow = countMatchesInSyncWindow(typedMatches, config.cron, now);
    totalInWindow += inWindow;

    if (!shouldRunCronNow(config.cron, inWindow, now)) {
      details.push(
        `Turniir ${tournamentId}: vahele jäetud (${inWindow} mängu aknas, intervall ${config.cron.interval_minutes} min)`,
      );
      continue;
    }

    const windowMatches = typedMatches.filter((match) =>
      isMatchInSyncWindow(match, config.cron, now),
    );
    const tournamentSlug = slugByTournament.get(tournamentId) ?? tournamentId;
    const syncResult = await syncTournamentMatches(
      admin,
      tournamentSlug,
      typedMatches,
      windowMatches,
      now,
    );
    totalLiveUpdated += syncResult.liveUpdated;
    totalScoresUpdated += syncResult.scoresUpdated;
    details.push(...syncResult.details);

    const bonusResult = await syncTournamentBonusResults(
      admin,
      tournamentId,
      typedMatches,
    );
    totalBonusUpdated += bonusResult.bonusUpdated;
    details.push(...bonusResult.details);

    for (const groupId of config.groupIds) {
      const { error: recalcError } = await admin.rpc("recalculate_group_match_points", {
        p_group_id: groupId,
      });

      if (recalcError) {
        details.push(`Grupp ${groupId}: punktide arvutus — ${recalcError.message}`);
      }
    }

    tournamentsSynced += 1;

    for (const groupId of config.groupIds) {
      await admin.rpc("touch_group_cron_run", { p_group_id: groupId });
    }
  }

  return {
    ok: true,
    skipped: tournamentsSynced === 0,
    groupsChecked: enabledRows.length,
    tournamentsSynced,
    matchesInWindow: totalInWindow,
    matchesUpdated: totalLiveUpdated,
    scoresUpdated: totalScoresUpdated,
    bonusUpdated: totalBonusUpdated,
    details,
  };
}

export function computeCronStatus(
  matches: Array<Pick<Match, "kickoff_at" | "status">>,
  cron: CronSettings,
  now = Date.now(),
) {
  const activeCount = countMatchesInSyncWindow(matches, cron, now);

  return {
    activeCount,
    nextEligible: shouldRunCronNow(cron, activeCount, now),
  };
}

export async function getCronStatus(
  tournamentId: string,
  cron: CronSettings,
  now = Date.now(),
) {
  const admin = createAdminClient();

  if (!admin) {
    return {
      activeCount: 0,
      nextEligible: false,
      adminAvailable: false,
    };
  }

  const { data: matches } = await admin
    .from("matches")
    .select("kickoff_at, status")
    .eq("tournament_id", tournamentId);

  return {
    ...computeCronStatus((matches ?? []) as Match[], cron, now),
    adminAvailable: true,
  };
}
