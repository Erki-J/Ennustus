/**
 * Kontrollib mängupäevade jaotust (Kicktipp 1–10 + väljalangemine).
 * Käivita: node scripts/verify-matchdays.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  kicktippGroupMatchday,
  openfootballMatchday,
  stageSortOrder,
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
  Uzbekistan: "Usbekistan",
  Colombia: "Colombia",
  England: "Inglismaa",
  Croatia: "Horvaatia",
  Ghana: "Ghana",
  Panama: "Panama",
};

const STAGE_LABEL = {
  group: (n) => `Mängupäev ${n}`,
  round_32: () => "1/16 finaal",
  round_16: () => "Kaheksandikfinaal",
  quarter: () => "Veerandfinaal",
  semi: () => "Poolfinaal",
  third: () => "3. koha mäng",
  final: () => "Finaal",
};

function translateTeam(name) {
  return TEAM_ET[name] ?? name;
}

function parseKickoffUtc(date, timeStr) {
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]?\d+(?::\d{2})?)?/i);
  if (!m) return `${date}T12:00:00+00`;
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
  return base.toISOString();
}

const data = JSON.parse(
  readFileSync(join(root, "supabase/data/wc2026-worldcup.json"), "utf8"),
);

const rows = [];

for (const match of data.matches) {
  let stage = "group";
  let matchday = 1;
  let groupCode = null;

  if (match.group) {
    const ofDay = openfootballMatchday(match.round);
    matchday = kicktippGroupMatchday(ofDay);
    groupCode = match.group.replace(/^Group\s+/i, "");
  } else if (match.round === "Round of 32") {
    stage = "round_32";
  } else if (match.round === "Round of 16") {
    stage = "round_16";
  } else if (match.round === "Quarter-final") {
    stage = "quarter";
  } else if (match.round === "Semi-final") {
    stage = "semi";
  } else if (match.round === "Match for third place") {
    stage = "third";
  } else if (match.round === "Final") {
    stage = "final";
  }

  const score = match.score?.ft
    ? `${match.score.ft[0]}:${match.score.ft[1]}`
    : "—";

  rows.push({
    stage,
    matchday,
    groupCode,
    kickoff: parseKickoffUtc(match.date, match.time),
    home: translateTeam(match.team1),
    away: translateTeam(match.team2),
    score,
    ofDay: match.group ? openfootballMatchday(match.round) : null,
  });
}

rows.sort((a, b) => {
  const sd = stageSortOrder(a.stage) - stageSortOrder(b.stage);
  if (sd !== 0) return sd;
  if (a.matchday !== b.matchday) return a.matchday - b.matchday;
  return a.kickoff.localeCompare(b.kickoff);
});

const rounds = new Map();
for (const row of rows) {
  const key = `${row.stage}:${row.matchday}`;
  if (!rounds.has(key)) {
    const labelFn = STAGE_LABEL[row.stage];
    rounds.set(key, {
      stage: row.stage,
      matchday: row.matchday,
      label: labelFn ? labelFn(row.matchday) : row.stage,
      matches: [],
    });
  }
  rounds.get(key).matches.push(row);
}

console.log("=== MM 2026 mängupäevade ülevaade (Kicktipp) ===\n");
console.log(`Kokku mänge: ${rows.length}`);
console.log(`Mängupäevi / vooru: ${rounds.size}\n`);

for (const round of [...rounds.values()].sort((a, b) => {
  const sd = stageSortOrder(a.stage) - stageSortOrder(b.stage);
  if (sd !== 0) return sd;
  return a.matchday - b.matchday;
})) {
  console.log(`── ${round.label} (${round.matches.length} mängu) ──`);
  for (const m of round.matches) {
    const gr = m.groupCode ? `Gr ${m.groupCode}` : "—";
    const of = m.ofDay ? ` [OF päev ${m.ofDay}]` : "";
    const date = m.kickoff.slice(0, 10);
    console.log(
      `  ${date}  ${m.home} – ${m.away}  (${gr})  ${m.score}${of}`,
    );
  }
  console.log("");
}

const groupDays = [...rounds.values()].filter((r) => r.stage === "group");
const expectedCounts = { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 6, 8: 6, 9: 6, 10: 6 };
if (groupDays.length !== 10) {
  console.log(`⚠️  Alagrupi mängupäevi: ${groupDays.length} (oodatud 10)`);
} else {
  console.log("✓ Alagrupis 10 mängupäeva");
}
for (const day of groupDays) {
  const exp = expectedCounts[day.matchday];
  if (exp && day.matches.length !== exp) {
    console.log(
      `⚠️  ${day.label}: ${day.matches.length} mängu (oodatud ${exp})`,
    );
  }
}

const groupMatchCount = groupDays.reduce((s, r) => s + r.matches.length, 0);
console.log(`✓ Alagrupi mänge: ${groupMatchCount} (oodatud 72)`);
