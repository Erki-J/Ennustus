import { parseCronSettings } from "@/lib/cron/settings";
import {
  countMatchesInSyncWindow,
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

async function syncTournamentMatches(matches: Match[]) {
  const admin = createAdminClient();

  if (!admin) {
    return {
      updated: 0,
      details: ["SUPABASE_SERVICE_ROLE_KEY puudub — tulemusi ei uuendatud."],
    };
  }

  const now = Date.now();
  let updated = 0;
  const details: string[] = [];

  for (const match of matches) {
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

    updated += 1;
    details.push(`${match.home_team}–${match.away_team}: märgitud live`);
  }

  if (process.env.FOOTBALL_DATA_API_KEY) {
    details.push(
      "FOOTBALL_DATA_API_KEY on seadistatud — skooride API sidumine tuleb järgmises sammus.",
    );
  } else {
    details.push(
      "Skooride automaatpäringu API pole seadistatud — uuendati ainult mängu staatust.",
    );
  }

  return { updated, details };
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

  const now = Date.now();
  let tournamentsSynced = 0;
  let totalInWindow = 0;
  let totalUpdated = 0;
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
      countMatchesInSyncWindow([match], config.cron, now),
    );
    const syncResult = await syncTournamentMatches(windowMatches);
    totalUpdated += syncResult.updated;
    details.push(...syncResult.details);
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
    matchesUpdated: totalUpdated,
    details,
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
    };
  }

  const { data: matches } = await admin
    .from("matches")
    .select("kickoff_at")
    .eq("tournament_id", tournamentId);

  const activeCount = countMatchesInSyncWindow(matches ?? [], cron, now);

  return {
    activeCount,
    nextEligible: shouldRunCronNow(cron, activeCount, now),
  };
}
