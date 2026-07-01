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
  // MD1
  "Mehhiko|Lõuna-Aafrika": [3, 0],
  "Lõuna-Korea|Tšehhi": [1, 2],
  "Kanada|Bosnia ja Hertsegoviina": [1, 1],
  "USA|Paraguay": [1, 3],
  "Katar|Šveits": [1, 4],
  "Brasiilia|Maroko": [2, 0],
  "Haiti|Šotimaa": [0, 3],
  "Austraalia|Türgi": [1, 2],
  // MD2
  "Saksamaa|Curaçao": [4, 0],
  "Holland|Jaapan": [2, 0],
  "Elevandiluurannik|Ecuador": [2, 2],
  "Rootsi|Tuneesia": [2, 1],
  "Hispaania|Roheneemesaared": [3, 0],
  "Belgia|Egiptus": [2, 0],
  "Saudi Araabia|Uruguay": [0, 2],
  "Iraan|Uus-Meremaa": [1, 1],
  // MD3
  "Prantsusmaa|Senegal": [3, 0],
  "Iraak|Norra": [1, 3],
  "Argentina|Alžeeria": [3, 0],
  "Austria|Jordaania": [2, 1],
  "Portugal|Kongo DV": [4, 1],
  "Inglismaa|Horvaatia": [2, 2],
  "Ghana|Panama": [3, 1],
  "Usbekistan|Colombia": [0, 2],
  // MD4
  "Tšehhi|Lõuna-Aafrika": [2, 0],
  "Šveits|Bosnia ja Hertsegoviina": [3, 1],
  "Kanada|Katar": [2, 0],
  "Mehhiko|Lõuna-Korea": [2, 1],
  "USA|Austraalia": [1, 0],
  "Šotimaa|Maroko": [2, 2],
  "Brasiilia|Haiti": [3, 0],
  "Türgi|Paraguay": [3, 2],
  // MD5
  "Holland|Rootsi": [3, 1],
  "Saksamaa|Elevandiluurannik": [4, 0],
  "Ecuador|Curaçao": [2, 0],
  "Tuneesia|Jaapan": [1, 3],
  "Hispaania|Saudi Araabia": [2, 1],
  "Belgia|Iraan": [2, 0],
  "Uruguay|Roheneemesaared": [3, 0],
  "Uus-Meremaa|Egiptus": [2, 2],
  // MD6
  "Argentina|Austria": [3, 1],
  "Prantsusmaa|Iraak": [4, 0],
  "Norra|Senegal": [3, 2],
  "Jordaania|Alžeeria": [1, 2],
  "Portugal|Usbekistan": [3, 0],
  "Inglismaa|Ghana": [3, 0],
  "Panama|Horvaatia": [0, 2],
  "Colombia|Kongo DV": [1, 0],
  // MD7
  "Bosnia ja Hertsegoviina|Katar": [2, 1],
  "Šveits|Kanada": [3, 1],
  "Maroko|Haiti": [2, 0],
  "Šotimaa|Brasiilia": [1, 3],
  "Lõuna-Aafrika|Lõuna-Korea": [0, 2],
  "Tšehhi|Mehhiko": [1, 3],
  // MD8
  "Curaçao|Elevandiluurannik": [1, 2],
  "Ecuador|Saksamaa": [0, 4],
  "Jaapan|Rootsi": [2, 2],
  "Tuneesia|Holland": [0, 3],
  "Paraguay|Austraalia": [1, 1],
  "Türgi|USA": [2, 3],
  // MD9
  "Norra|Prantsusmaa": [1, 3],
  "Senegal|Iraak": [2, 1],
  "Uruguay|Hispaania": [0, 3],
  "Roheneemesaared|Saudi Araabia": [1, 1],
  "Uus-Meremaa|Belgia": [0, 2],
  "Egiptus|Iraan": [1, 1],
  // MD10
  "Horvaatia|Ghana": [3, 1],
  "Panama|Inglismaa": [0, 3],
  "Kongo DV|Usbekistan": [1, 0],
  "Colombia|Portugal": [1, 3],
  "Alžeeria|Austria": [0, 2],
  "Jordaania|Argentina": [0, 3],
  // 1/16 finaal
  "Lõuna-Aafrika|Kanada": [0, 2],
  "Brasiilia|Jaapan": [3, 1],
  "Saksamaa|Paraguay": [3, 0],
  "Holland|Maroko": [2, 0],
  "Elevandiluurannik|Norra": [1, 2],
  "Prantsusmaa|Rootsi": [3, 0],
  "Mehhiko|Ecuador": [2, 1],
  "Inglismaa|Kongo DV": [2, 0],
  "Belgia|Senegal": [1, 0],
  "USA|Bosnia ja Hertsegoviina": [3, 2],
  "Hispaania|Austria": [2, 0],
  "Portugal|Horvaatia": [3, 2],
  "Šveits|Alžeeria": [1, 0],
  "Austraalia|Egiptus": [1, 3],
  "Argentina|Roheneemesaared": [3, 0],
  "Colombia|Ghana": [2, 0],
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
    A: "Tšehhi",
    B: "Šveits",
    C: "Brasiilia",
    D: "Paraguay",
    E: "Saksamaa",
    F: "Holland",
    G: "Belgia",
    H: "Hispaania",
    I: "Prantsusmaa",
    J: "Argentina",
    K: "Portugal",
    L: "Inglismaa",
  },
  tournament_winner: "Brasiilia",
  top_scorer: "Saksamaa",
  semifinalists: {
    22: "Inglismaa",
    23: "Argentina",
    24: "Brasiilia",
    25: "Saksamaa",
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
