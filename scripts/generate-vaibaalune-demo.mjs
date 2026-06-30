/**
 * Genereerib supabase/seed-vaibaalune-demo.sql
 * Käivita: node scripts/generate-vaibaalune-demo.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

function translateTeam(name) {
  return TEAM_ET[name] ?? name;
}

function matchKey(home, away) {
  return `${home}|${away}`;
}

const PREDICTION_OVERRIDES = {
  // MD1 — Vaibaalune (Kicktipp: P=8)
  "Mehhiko|Lõuna-Aafrika": [3, 0],
  "Lõuna-Korea|Tšehhi": [1, 2],
  "Kanada|Bosnia ja Hertsegoviina": [1, 1],
  "USA|Paraguay": [1, 3],
  "Katar|Šveits": [1, 4],
  "Brasiilia|Maroko": [2, 0],
  "Haiti|Šotimaa": [0, 3],
  "Austraalia|Türgi": [1, 2],
  "Holland|Jaapan": [2, 1],
  "Norra|Prantsusmaa": [0, 2],
  "Brasiilia|Jaapan": [2, 0],
  "Lõuna-Aafrika|Kanada": [0, 1],
};

function defaultPrediction(actualHome, actualAway) {
  if (actualHome === null || actualAway === null) {
    return [1, 1];
  }
  if (actualHome > actualAway) {
    return [actualHome, Math.max(0, actualAway - 1)];
  }
  if (actualAway > actualHome) {
    return [Math.max(0, actualHome - 1), actualAway];
  }
  return [actualHome + 1, actualAway];
}

const BONUS_CORRECT = {
  A: "Mehhiko",
  B: "Šveits",
  C: "Brasiilia",
  D: "USA",
  E: "Saksamaa",
  F: "Holland",
  G: "Belgia",
  H: "Hispaania",
  I: "Prantsusmaa",
  J: "Argentina",
  K: "Colombia",
  L: "Inglismaa",
};

const VAIBAALUNE_BONUS = {
  groups: {
    A: "Mehhiko",
    B: "Šveits",
    C: "Brasiilia",
    D: "USA",
    E: "Saksamaa",
    F: "Holland",
    G: "Belgia",
    H: "Hispaania",
    I: "Prantsusmaa",
    J: "Argentina",
    K: "Portugal",
    L: "Inglismaa",
  },
  tournament_winner: "Argentina",
  top_scorer: "Saksamaa",
  semifinalists: {
    22: "Brasiilia",
    23: "Argentina",
    24: "Prantsusmaa",
    25: "Inglismaa",
  },
};

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

const jsonPath = join(root, "supabase/data/wc2026-worldcup.json");
const data = JSON.parse(readFileSync(jsonPath, "utf8"));

const allPredictions = [];

for (const match of data.matches) {
  const home = translateTeam(match.team1);
  const away = translateTeam(match.team2);
  const [ah, aa] = match.score?.ft ?? [null, null];
  const key = matchKey(home, away);
  const [hg, ag] = PREDICTION_OVERRIDES[key] ?? defaultPrediction(ah, aa);
  allPredictions.push({ home, away, hg, ag });
}

const matchPredLines = allPredictions.map(
  (p) =>
    `    ('${escapeSql(p.home)}', '${escapeSql(p.away)}', ${p.hg}, ${p.ag})`,
);

const groupCorrectSql = Object.entries(BONUS_CORRECT)
  .map(
    ([code, answer]) => `update public.bonus_questions bq
set correct_answer = '${escapeSql(answer)}'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = '${code}';`,
  )
  .join("\n\n");

const groupBonusValues = Object.entries(VAIBAALUNE_BONUS.groups)
  .map(
    ([code, answer]) =>
      `    ('group_winner', '${code}', '${escapeSql(answer)}')`,
  )
  .join(",\n");

const sfBonusValues = Object.entries(VAIBAALUNE_BONUS.semifinalists)
  .map(
    ([sort, answer]) =>
      `    (${sort}, '${escapeSql(answer)}')`,
  )
  .join(",\n");

const USER_FILTER = `(gm.nickname ilike 'Vaibaalune%' or exists (
  select 1 from public.profiles p
  where p.id = gm.user_id
    and (p.display_name ilike 'Vaibaalune%' or p.email = 'erks172@hotmail.com')
))`;

const sql = `-- Vaibaalune demo ennustused + boonus
-- Käivita Supabase SQL Editoris PÄRAST seed-wc2026-full.sql
-- Otsib kasutajat: hüüdnimi/display_name "Vaibaalune%" või e-mail erks172@hotmail.com

-- 1) Vaibaalune mänguennustused (punktid arvutatakse automaatselt)
insert into public.match_predictions (
  group_id, user_id, match_id, home_goals, away_goals, points, last_modified_by, modified_by_admin
)
select
  gm.group_id,
  gm.user_id,
  m.id,
  v.home_goals,
  v.away_goals,
  public.calculate_prediction_points(
    v.home_goals,
    v.away_goals,
    m.home_score,
    m.away_score,
    gs.scoring
  ),
  gm.user_id,
  false
from public.group_members gm
join public.prediction_groups pg on pg.id = gm.group_id
join public.tournaments t on t.id = pg.tournament_id
join public.group_settings gs on gs.group_id = gm.group_id
cross join (
  values
${matchPredLines.join(",\n")}
) as v(home_team, away_team, home_goals, away_goals)
join public.matches m on m.tournament_id = t.id
  and m.home_team = v.home_team
  and m.away_team = v.away_team
where t.slug = 'wc-2026'
  and ${USER_FILTER}
on conflict (group_id, user_id, match_id)
do update set
  home_goals = excluded.home_goals,
  away_goals = excluded.away_goals,
  points = excluded.points,
  updated_at = now();

-- 2) Boonuse õiged vastused (grupivõitjad)
${groupCorrectSql}

-- 3) Vaibaalune — grupivõitjad
insert into public.bonus_predictions (group_id, user_id, question_id, answer, points, last_modified_by)
select
  gm.group_id,
  gm.user_id,
  bq.id,
  v.answer,
  case
    when bq.correct_answer is not null
      and lower(trim(bq.correct_answer)) = lower(trim(v.answer))
    then bq.points_value
    else 0
  end,
  gm.user_id
from public.group_members gm
join public.prediction_groups pg on pg.id = gm.group_id
join public.tournaments t on t.id = pg.tournament_id
join public.bonus_questions bq on bq.tournament_id = t.id
cross join (
  values
${groupBonusValues}
) as v(question_type, group_code, answer)
where t.slug = 'wc-2026'
  and ${USER_FILTER}
  and bq.question_type = 'group_winner'
  and bq.group_code = v.group_code
on conflict (group_id, user_id, question_id)
do update set answer = excluded.answer, points = excluded.points, updated_at = now();

-- 4) Vaibaalune — MM võitja + väravalööja
insert into public.bonus_predictions (group_id, user_id, question_id, answer, points, last_modified_by)
select
  gm.group_id,
  gm.user_id,
  bq.id,
  v.answer,
  case
    when bq.correct_answer is not null
      and lower(trim(bq.correct_answer)) = lower(trim(v.answer))
    then bq.points_value
    else 0
  end,
  gm.user_id
from public.group_members gm
join public.prediction_groups pg on pg.id = gm.group_id
join public.tournaments t on t.id = pg.tournament_id
join public.bonus_questions bq on bq.tournament_id = t.id
cross join (
  values
    ('tournament_winner', '${escapeSql(VAIBAALUNE_BONUS.tournament_winner)}'),
    ('top_scorer', '${escapeSql(VAIBAALUNE_BONUS.top_scorer)}')
) as v(question_type, answer)
where t.slug = 'wc-2026'
  and ${USER_FILTER}
  and bq.question_type = v.question_type::public.bonus_question_type
on conflict (group_id, user_id, question_id)
do update set answer = excluded.answer, points = excluded.points, updated_at = now();

-- 5) Vaibaalune — poolfinaalisti
insert into public.bonus_predictions (group_id, user_id, question_id, answer, points, last_modified_by)
select
  gm.group_id,
  gm.user_id,
  bq.id,
  v.answer,
  case
    when bq.correct_answer is not null
      and lower(trim(bq.correct_answer)) = lower(trim(v.answer))
    then bq.points_value
    else 0
  end,
  gm.user_id
from public.group_members gm
join public.prediction_groups pg on pg.id = gm.group_id
join public.tournaments t on t.id = pg.tournament_id
join public.bonus_questions bq on bq.tournament_id = t.id
cross join (
  values
${sfBonusValues}
) as v(sort_order, answer)
where t.slug = 'wc-2026'
  and ${USER_FILTER}
  and bq.question_type = 'semifinalist'
  and bq.sort_order = v.sort_order
on conflict (group_id, user_id, question_id)
do update set answer = excluded.answer, points = excluded.points, updated_at = now();
`;

writeFileSync(join(root, "supabase/seed-vaibaalune-demo.sql"), sql, "utf8");
console.log(`Match predictions: ${allPredictions.length}`);
