/**
 * Genereerib supabase/seed-wc2026-full.sql openfootball/worldcup.json põhjal.
 * Käivita: node scripts/generate-wc2026-seed.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  kicktippGroupMatchday,
  openfootballMatchday,
} from "./kicktipp-matchdays.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const TEAM_ET = {
  Mexico: "Mehhiko",
  "South Africa": "Lõuna-Aafrika",
  "South Korea": "Lõuna-Korea",
  "Czech Republic": "Tšehhi",
  Czechia: "Tšehhi",
  Canada: "Kanada",
  "Bosnia and Herzegovina": "Bosnia ja Hertsegoviina",
  "Bosnia & Herzegovina": "Bosnia ja Hertsegoviina",
  Qatar: "Katar",
  Switzerland: "Šveits",
  Brazil: "Brasiilia",
  Morocco: "Maroko",
  Haiti: "Haiti",
  Scotland: "Šotimaa",
  "United States": "USA",
  Paraguay: "Paraguay",
  Australia: "Austraalia",
  Türkiye: "Türgi",
  Turkey: "Türgi",
  Germany: "Saksamaa",
  Curacao: "Curaçao",
  Curaçao: "Curaçao",
  "Ivory Coast": "Elevandiluurannik",
  "Côte d'Ivoire": "Elevandiluurannik",
  Ecuador: "Ecuador",
  Netherlands: "Holland",
  Japan: "Jaapan",
  Sweden: "Rootsi",
  Tunisia: "Tuneesia",
  Belgium: "Belgia",
  Egypt: "Egiptus",
  Iran: "Iraan",
  "New Zealand": "Uus-Meremaa",
  Spain: "Hispaania",
  "Cape Verde": "Roheneemesaared",
  "Saudi Arabia": "Saudi Araabia",
  Uruguay: "Uruguay",
  France: "Prantsusmaa",
  Senegal: "Senegal",
  Iraq: "Iraak",
  Norway: "Norra",
  Argentina: "Argentina",
  Algeria: "Alžeeria",
  Austria: "Austria",
  Jordan: "Jordaania",
  Portugal: "Portugal",
  "DR Congo": "Kongo DV",
  "Democratic Republic of Congo": "Kongo DV",
  Uzbekistan: "Usbekistan",
  Colombia: "Colombia",
  England: "Inglismaa",
  Croatia: "Horvaatia",
  Ghana: "Ghana",
  Panama: "Panama",
  Sudan: "Sudaan",
  Estonia: "Eesti",
};

const KNOCKOUT_ET = {
  "Round of 32": { stage: "round_32", matchday: 1, label: "1/16 finaal" },
  "Round of 16": { stage: "round_16", matchday: 1, label: "Kaheksandikfinaal" },
  "Quarter-final": { stage: "quarter", matchday: 1, label: "Veerandfinaal" },
  "Semi-final": { stage: "semi", matchday: 1, label: "Poolfinaal" },
  "Match for third place": { stage: "third", matchday: 1, label: "3. koha mäng" },
  Final: { stage: "final", matchday: 1, label: "Finaal" },
};

function translateTeam(name) {
  if (!name) return "Tundmatu";
  if (TEAM_ET[name]) return TEAM_ET[name];
  if (/^W\d+$/.test(name)) return "Tundmatu";
  if (/^Winner/i.test(name)) return "Tundmatu";
  if (/^Loser/i.test(name)) return "Tundmatu";
  if (name.includes("Winner") || name.includes("Loser")) return "Tundmatu";
  return name;
}

function parseKickoffUtc(date, timeStr) {
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]?\d+(?::\d{2})?)?/i);
  if (!m) {
    throw new Error(`Cannot parse time: ${date} ${timeStr}`);
  }
  const localHours = Number(m[1]);
  const localMins = Number(m[2]);
  const offsetRaw = m[3] ?? "0";
  let offsetHours = 0;
  if (offsetRaw.includes(":")) {
    const sign = offsetRaw.startsWith("-") ? -1 : 1;
    const parts = offsetRaw.replace(/^[-+]/, "").split(":");
    offsetHours = sign * (Number(parts[0]) + Number(parts[1] ?? 0) / 60);
  } else {
    offsetHours = Number(offsetRaw);
  }
  const utcTotalMins = localHours * 60 + localMins - offsetHours * 60;
  const base = new Date(`${date}T00:00:00.000Z`);
  base.setUTCMinutes(base.getUTCMinutes() + utcTotalMins);
  return base.toISOString().replace(".000Z", "+00");
}

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function mapMatch(match) {
  let stage = "group";
  let matchday = 1;
  let groupCode = null;

  if (match.group) {
    const ofDay = openfootballMatchday(match.round);
    matchday = kicktippGroupMatchday(ofDay);
    groupCode = match.group.replace(/^Group\s+/i, "");
    stage = "group";
  } else {
    const ko = KNOCKOUT_ET[match.round];
    if (!ko) throw new Error(`Unknown round: ${match.round}`);
    stage = ko.stage;
    matchday = ko.matchday;
  }

  const kickoff = parseKickoffUtc(match.date, match.time);
  const home = translateTeam(match.team1);
  const away = translateTeam(match.team2);

  let homeScore = null;
  let awayScore = null;
  let status = "scheduled";

  if (match.score?.ft) {
    homeScore = match.score.ft[0];
    awayScore = match.score.ft[1];
    status = "finished";
  }

  return {
    home_team: home,
    away_team: away,
    kickoff_at: kickoff,
    stage,
    matchday,
    group_code: groupCode,
    home_score: homeScore,
    away_score: awayScore,
    status,
  };
}

const jsonPath =
  process.argv[2] ?? join(root, "supabase/data/wc2026-worldcup.json");
const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const rows = data.matches.map((match) => mapMatch(match));
rows.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
rows.forEach((row, index) => {
  row.sort_order = index + 1;
});

const valueLines = rows.map((row) => {
  const hs =
    row.home_score === null ? "null::int" : String(row.home_score);
  const as =
    row.away_score === null ? "null::int" : String(row.away_score);
  const gc = row.group_code ? `'${escapeSql(row.group_code)}'` : "null";

  return `    ('${escapeSql(row.home_team)}', '${escapeSql(row.away_team)}', '${row.kickoff_at}', '${row.stage}', ${row.matchday}, ${gc}, ${row.sort_order}, ${hs}, ${as}, '${row.status}'::public.match_status)`;
});

const sql = `-- Täispikk Jalgpalli MM 2026 ajakava (104 mängu)
-- Allikas: openfootball/worldcup.json (public domain)
-- Genereeritud: node scripts/generate-wc2026-seed.mjs
-- Alagrupp: Kicktipp mängupäevad 1–10 (mitte 17 kalendripäeva)
--
-- ⚠️ Kustutab olemasolevad MM 2026 mängud ja seotud ennustused!
-- Käivita Supabase SQL Editoris PÄRAST migration-005-matchdays.sql

delete from public.match_predictions
where match_id in (
  select m.id
  from public.matches m
  join public.tournaments t on t.id = m.tournament_id
  where t.slug = 'wc-2026'
);

delete from public.matches
where tournament_id in (
  select id from public.tournaments where slug = 'wc-2026'
);

insert into public.matches (
  tournament_id,
  home_team,
  away_team,
  kickoff_at,
  stage,
  matchday,
  group_code,
  sort_order,
  home_score,
  away_score,
  status
)
select
  t.id,
  v.home_team,
  v.away_team,
  v.kickoff_at::timestamptz,
  v.stage,
  v.matchday,
  v.group_code,
  v.sort_order,
  v.home_score,
  v.away_score,
  v.status
from public.tournaments t
cross join (
  values
${valueLines.join(",\n")}
) as v(home_team, away_team, kickoff_at, stage, matchday, group_code, sort_order, home_score, away_score, status)
where t.slug = 'wc-2026';
`;

const outPath = join(root, "supabase/seed-wc2026-full.sql");
writeFileSync(outPath, sql, "utf8");
console.log(`Wrote ${rows.length} matches to ${outPath}`);
console.log(
  "Finished:",
  rows.filter((r) => r.status === "finished").length,
  "| Scheduled:",
  rows.filter((r) => r.status === "scheduled").length,
);
