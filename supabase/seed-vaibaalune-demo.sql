-- Vaibaalune demo ennustused + boonus
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
    ('Mehhiko', 'Lõuna-Aafrika', 3, 0),
    ('Lõuna-Korea', 'Tšehhi', 1, 2),
    ('Tšehhi', 'Lõuna-Aafrika', 2, 1),
    ('Mehhiko', 'Lõuna-Korea', 1, 0),
    ('Tšehhi', 'Mehhiko', 0, 3),
    ('Lõuna-Aafrika', 'Lõuna-Korea', 1, 0),
    ('Kanada', 'Bosnia ja Hertsegoviina', 1, 1),
    ('Katar', 'Šveits', 1, 4),
    ('Šveits', 'Bosnia ja Hertsegoviina', 4, 0),
    ('Kanada', 'Katar', 6, 0),
    ('Šveits', 'Kanada', 2, 0),
    ('Bosnia ja Hertsegoviina', 'Katar', 3, 0),
    ('Brasiilia', 'Maroko', 2, 0),
    ('Haiti', 'Šotimaa', 0, 3),
    ('Šotimaa', 'Maroko', 0, 1),
    ('Brasiilia', 'Haiti', 3, 0),
    ('Šotimaa', 'Brasiilia', 0, 3),
    ('Maroko', 'Haiti', 4, 1),
    ('USA', 'Paraguay', 1, 3),
    ('Austraalia', 'Türgi', 1, 2),
    ('USA', 'Austraalia', 2, 0),
    ('Türgi', 'Paraguay', 0, 1),
    ('Türgi', 'USA', 3, 1),
    ('Paraguay', 'Austraalia', 1, 0),
    ('Saksamaa', 'Curaçao', 7, 0),
    ('Elevandiluurannik', 'Ecuador', 1, 0),
    ('Saksamaa', 'Elevandiluurannik', 2, 0),
    ('Ecuador', 'Curaçao', 1, 0),
    ('Curaçao', 'Elevandiluurannik', 0, 2),
    ('Ecuador', 'Saksamaa', 2, 0),
    ('Holland', 'Jaapan', 2, 1),
    ('Rootsi', 'Tuneesia', 5, 0),
    ('Holland', 'Rootsi', 5, 0),
    ('Tuneesia', 'Jaapan', 0, 4),
    ('Jaapan', 'Rootsi', 2, 1),
    ('Tuneesia', 'Holland', 0, 3),
    ('Belgia', 'Egiptus', 2, 1),
    ('Iraan', 'Uus-Meremaa', 3, 2),
    ('Belgia', 'Iraan', 1, 0),
    ('Uus-Meremaa', 'Egiptus', 0, 3),
    ('Egiptus', 'Iraan', 2, 1),
    ('Uus-Meremaa', 'Belgia', 0, 5),
    ('Hispaania', 'Roheneemesaared', 1, 0),
    ('Saudi Araabia', 'Uruguay', 2, 1),
    ('Hispaania', 'Saudi Araabia', 4, 0),
    ('Uruguay', 'Roheneemesaared', 3, 2),
    ('Roheneemesaared', 'Saudi Araabia', 1, 0),
    ('Uruguay', 'Hispaania', 0, 1),
    ('Prantsusmaa', 'Senegal', 3, 0),
    ('Iraak', 'Norra', 0, 4),
    ('Prantsusmaa', 'Iraak', 3, 0),
    ('Norra', 'Senegal', 3, 1),
    ('Norra', 'Prantsusmaa', 0, 2),
    ('Senegal', 'Iraak', 5, 0),
    ('Argentina', 'Alžeeria', 3, 0),
    ('Austria', 'Jordaania', 3, 0),
    ('Argentina', 'Austria', 2, 0),
    ('Jordaania', 'Alžeeria', 0, 2),
    ('Alžeeria', 'Austria', 4, 3),
    ('Jordaania', 'Argentina', 0, 3),
    ('Portugal', 'Kongo DV', 2, 1),
    ('Usbekistan', 'Colombia', 0, 3),
    ('Portugal', 'Usbekistan', 5, 0),
    ('Colombia', 'Kongo DV', 1, 0),
    ('Colombia', 'Portugal', 1, 0),
    ('Kongo DV', 'Usbekistan', 3, 0),
    ('Inglismaa', 'Horvaatia', 4, 1),
    ('Ghana', 'Panama', 1, 0),
    ('Inglismaa', 'Ghana', 1, 0),
    ('Panama', 'Horvaatia', 0, 1),
    ('Panama', 'Inglismaa', 0, 2),
    ('Horvaatia', 'Ghana', 2, 0),
    ('Lõuna-Aafrika', 'Kanada', 0, 1),
    ('Saksamaa', 'Paraguay', 1, 1),
    ('Holland', 'Maroko', 1, 1),
    ('Brasiilia', 'Jaapan', 2, 0),
    ('Prantsusmaa', 'Rootsi', 1, 1),
    ('Elevandiluurannik', 'Norra', 1, 1),
    ('Mehhiko', 'Ecuador', 1, 1),
    ('Inglismaa', 'Kongo DV', 1, 1),
    ('USA', 'Bosnia ja Hertsegoviina', 1, 1),
    ('Belgia', 'Senegal', 1, 1),
    ('Portugal', 'Horvaatia', 1, 1),
    ('Hispaania', 'Austria', 1, 1),
    ('Šveits', 'Alžeeria', 1, 1),
    ('Argentina', 'Roheneemesaared', 1, 1),
    ('Colombia', 'Ghana', 1, 1),
    ('Austraalia', 'Egiptus', 1, 1),
    ('W74', 'W77', 1, 1),
    ('Kanada', 'W75', 1, 1),
    ('W76', 'W78', 1, 1),
    ('W79', 'W80', 1, 1),
    ('W83', 'W84', 1, 1),
    ('W81', 'W82', 1, 1),
    ('W86', 'W88', 1, 1),
    ('W85', 'W87', 1, 1),
    ('W89', 'W90', 1, 1),
    ('W93', 'W94', 1, 1),
    ('W91', 'W92', 1, 1),
    ('W95', 'W96', 1, 1),
    ('W97', 'W98', 1, 1),
    ('W99', 'W100', 1, 1),
    ('L101', 'L102', 1, 1),
    ('W101', 'W102', 1, 1)
) as v(home_team, away_team, home_goals, away_goals)
join public.matches m on m.tournament_id = t.id
  and m.home_team = v.home_team
  and m.away_team = v.away_team
where t.slug = 'wc-2026'
  and (gm.nickname ilike 'Vaibaalune%' or exists (
  select 1 from public.profiles p
  where p.id = gm.user_id
    and (p.display_name ilike 'Vaibaalune%' or p.email = 'erks172@hotmail.com')
))
on conflict (group_id, user_id, match_id)
do update set
  home_goals = excluded.home_goals,
  away_goals = excluded.away_goals,
  points = excluded.points,
  updated_at = now();

-- 2) Boonuse õiged vastused (grupivõitjad)
update public.bonus_questions bq
set correct_answer = 'Mehhiko'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'A';

update public.bonus_questions bq
set correct_answer = 'Šveits'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'B';

update public.bonus_questions bq
set correct_answer = 'Brasiilia'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'C';

update public.bonus_questions bq
set correct_answer = 'USA'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'D';

update public.bonus_questions bq
set correct_answer = 'Saksamaa'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'E';

update public.bonus_questions bq
set correct_answer = 'Holland'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'F';

update public.bonus_questions bq
set correct_answer = 'Belgia'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'G';

update public.bonus_questions bq
set correct_answer = 'Hispaania'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'H';

update public.bonus_questions bq
set correct_answer = 'Prantsusmaa'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'I';

update public.bonus_questions bq
set correct_answer = 'Argentina'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'J';

update public.bonus_questions bq
set correct_answer = 'Colombia'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'K';

update public.bonus_questions bq
set correct_answer = 'Inglismaa'
from public.tournaments t
where bq.tournament_id = t.id
  and t.slug = 'wc-2026'
  and bq.question_type = 'group_winner'
  and bq.group_code = 'L';

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
    ('group_winner', 'A', 'Mehhiko'),
    ('group_winner', 'B', 'Šveits'),
    ('group_winner', 'C', 'Brasiilia'),
    ('group_winner', 'D', 'USA'),
    ('group_winner', 'E', 'Saksamaa'),
    ('group_winner', 'F', 'Holland'),
    ('group_winner', 'G', 'Belgia'),
    ('group_winner', 'H', 'Hispaania'),
    ('group_winner', 'I', 'Prantsusmaa'),
    ('group_winner', 'J', 'Argentina'),
    ('group_winner', 'K', 'Portugal'),
    ('group_winner', 'L', 'Inglismaa')
) as v(question_type, group_code, answer)
where t.slug = 'wc-2026'
  and (gm.nickname ilike 'Vaibaalune%' or exists (
  select 1 from public.profiles p
  where p.id = gm.user_id
    and (p.display_name ilike 'Vaibaalune%' or p.email = 'erks172@hotmail.com')
))
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
    ('tournament_winner', 'Argentina'),
    ('top_scorer', 'Saksamaa')
) as v(question_type, answer)
where t.slug = 'wc-2026'
  and (gm.nickname ilike 'Vaibaalune%' or exists (
  select 1 from public.profiles p
  where p.id = gm.user_id
    and (p.display_name ilike 'Vaibaalune%' or p.email = 'erks172@hotmail.com')
))
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
    (22, 'Brasiilia'),
    (23, 'Argentina'),
    (24, 'Prantsusmaa'),
    (25, 'Inglismaa')
) as v(sort_order, answer)
where t.slug = 'wc-2026'
  and (gm.nickname ilike 'Vaibaalune%' or exists (
  select 1 from public.profiles p
  where p.id = gm.user_id
    and (p.display_name ilike 'Vaibaalune%' or p.email = 'erks172@hotmail.com')
))
  and bq.question_type = 'semifinalist'
  and bq.sort_order = v.sort_order
on conflict (group_id, user_id, question_id)
do update set answer = excluded.answer, points = excluded.points, updated_at = now();
