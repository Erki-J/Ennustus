/**
 * Genereerib supabase/fix-bracket-match-numbers.sql
 * Parandab olemasoleva wc-2026 andmebaasi: sort_order = FIFA mängu number (73–104).
 * Ennustusi ei kustuta — uuendab mänge kickoff + stage järgi.
 *
 * Käivita: node scripts/generate-bracket-fix.mjs
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
  Türkiye: "Türki",
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
};

const KNOCKOUT_ET = {
  "Round of 32": { stage: "round_32", matchday: 1 },
  "Round of 16": { stage: "round_16", matchday: 1 },
  "Quarter-final": { stage: "quarter", matchday: 1 },
  "Semi-final": { stage: "semi", matchday: 1 },
  "Match for third place": { stage: "third", matchday: 1 },
  Final: { stage: "final", matchday: 1 },
};

function translateTeam(name) {
  if (!name) return "Tundmatu";
  if (TEAM_ET[name]) return TEAM_ET[name];
  if (/^W\d+$/.test(name)) return "Tundmatu";
  if (/^L\d+$/.test(name)) return name;
  if (/^Winner/i.test(name)) return "Tundmatu";
  if (/^Loser/i.test(name)) return "Tundmatu";
  if (name.includes("Winner") || name.includes("Loser")) return "Tundmatu";
  return name;
}

function parseKickoffUtc(date, timeStr) {
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]?\d+(?::\d{2})?)?/i);
  if (!m) throw new Error(`Cannot parse time: ${date} ${timeStr}`);
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

  return {
    home_team: translateTeam(match.team1),
    away_team: translateTeam(match.team2),
    kickoff_at: parseKickoffUtc(match.date, match.time),
    stage,
    matchday,
    group_code: groupCode,
    matchNum: match.num ?? null,
  };
}

const data = JSON.parse(
  readFileSync(join(root, "supabase/data/wc2026-worldcup.json"), "utf8"),
);
const rows = data.matches.map((match) => mapMatch(match));

const groupRows = rows.filter((row) => row.stage === "group");
groupRows.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
groupRows.forEach((row, index) => {
  row.sort_order = index + 1;
});

for (const row of rows) {
  if (row.matchNum != null) {
    row.sort_order = row.matchNum;
  }
}

const knockoutRows = rows.filter((row) => row.matchNum != null);
const valueLines = knockoutRows.map((row) => {
  const gc = row.group_code ? `'${escapeSql(row.group_code)}'` : "null";
  return `    (${row.sort_order}, '${escapeSql(row.home_team)}', '${escapeSql(row.away_team)}', '${row.kickoff_at}', '${row.stage}', ${row.matchday}, ${gc})`;
});

const sql = `-- Parandab wc-2026 väljalangemismängude FIFA numbrid (sort_order 73–104).
-- Allikas: openfootball worldcup.json (sama mis Kicktipp bracket).
-- Genereeritud: node scripts/generate-bracket-fix.mjs
--
-- ⚠️ Ennustusi EI kustuta. Uuendab mänge kickoff + stage järgi.
-- Käivita Supabase SQL Editoris, seejärel cron / lehe värskendus bracket täitmiseks.

update public.matches m
set
  sort_order = v.sort_order,
  home_team = v.home_team,
  away_team = v.away_team,
  kickoff_at = v.kickoff_at::timestamptz,
  matchday = v.matchday,
  group_code = v.group_code
from public.tournaments t
cross join (
  values
${valueLines.join(",\n")}
) as v(sort_order, home_team, away_team, kickoff_at, stage, matchday, group_code)
where m.tournament_id = t.id
  and t.slug = 'wc-2026'
  and m.stage = v.stage
  and m.kickoff_at = v.kickoff_at::timestamptz;
`;

const outPath = join(root, "supabase/fix-bracket-match-numbers.sql");
writeFileSync(outPath, sql, "utf8");
console.log(`Wrote ${knockoutRows.length} knockout updates to ${outPath}`);
