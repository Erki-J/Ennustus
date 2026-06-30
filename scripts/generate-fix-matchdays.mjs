/**
 * Genereerib supabase/fix-matchdays-kicktipp.sql seed-failist.
 * Käivita: node scripts/generate-fix-matchdays.mjs
 * (genereeri enne vajadusel: node scripts/generate-wc2026-seed.mjs)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = join(root, "supabase/seed-wc2026-full.sql");
const seed = readFileSync(seedPath, "utf8");

const rows = [];
for (const line of seed.split("\n")) {
  const match = line.match(
    /^\s*\('([^']+)', '([^']+)', '[^']+', 'group', (\d+), '[A-L]', (\d+),/,
  );
  if (match) {
    rows.push({
      home: match[1],
      away: match[2],
      md: Number(match[3]),
      sort: Number(match[4]),
    });
  }
}

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

const teamPairValues = rows
  .map(
    (row) =>
      `    ('${escapeSql(row.home)}', '${escapeSql(row.away)}', ${row.md})`,
  )
  .join(",\n");

const sortOrderValues = rows
  .map((row) => `    (${row.sort}, ${row.md})`)
  .join(",\n");

const sql = `-- Paranda mängupäevad Kicktippi jaotuse järgi
-- Käivita Supabase SQL Editoris — ei kustuta ennustusi

-- 1) Ühtlusta Bosnia nimi (vana seed võis kasutada inglise keeles)
update public.matches
set away_team = 'Bosnia ja Hertsegoviina'
where tournament_id in (select id from public.tournaments where slug = 'wc-2026')
  and away_team in ('Bosnia & Herzegovina', 'Bosnia and Herzegovina');

update public.matches
set home_team = 'Bosnia ja Hertsegoviina'
where tournament_id in (select id from public.tournaments where slug = 'wc-2026')
  and home_team in ('Bosnia & Herzegovina', 'Bosnia and Herzegovina');

-- 2) Mängupäev meeskondade järgi
update public.matches m
set matchday = v.matchday
from public.tournaments t,
(
  values
${teamPairValues}
) as v(home_team, away_team, matchday)
where m.tournament_id = t.id
  and t.slug = 'wc-2026'
  and m.stage = 'group'
  and m.home_team = v.home_team
  and m.away_team = v.away_team;

-- 3) Varukoopia: sort_order järgi (parandab Kanada–Bosnia jms kui nimed erinesid)
update public.matches m
set matchday = v.matchday
from public.tournaments t,
(
  values
${sortOrderValues}
) as v(sort_order, matchday)
where m.tournament_id = t.id
  and t.slug = 'wc-2026'
  and m.stage = 'group'
  and m.sort_order = v.sort_order;

-- 4) Kanada–Bosnia kindlalt MD1 (sort_order 3)
update public.matches m
set matchday = 1
from public.tournaments t
where m.tournament_id = t.id
  and t.slug = 'wc-2026'
  and m.stage = 'group'
  and m.home_team = 'Kanada'
  and m.away_team = 'Bosnia ja Hertsegoviina';
`;

writeFileSync(join(root, "supabase/fix-matchdays-kicktipp.sql"), sql);
console.log(`Wrote fix SQL (${rows.length} group matches, incl. sort_order fallback)`);
