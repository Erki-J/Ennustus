-- Paranda mängupäevad Kicktippi jaotuse järgi
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
    ('Mehhiko', 'Lõuna-Aafrika', 1),
    ('Lõuna-Korea', 'Tšehhi', 1),
    ('Kanada', 'Bosnia ja Hertsegoviina', 1),
    ('USA', 'Paraguay', 1),
    ('Katar', 'Šveits', 1),
    ('Brasiilia', 'Maroko', 1),
    ('Haiti', 'Šotimaa', 1),
    ('Austraalia', 'Türgi', 1),
    ('Saksamaa', 'Curaçao', 2),
    ('Holland', 'Jaapan', 2),
    ('Elevandiluurannik', 'Ecuador', 2),
    ('Rootsi', 'Tuneesia', 2),
    ('Hispaania', 'Roheneemesaared', 2),
    ('Belgia', 'Egiptus', 2),
    ('Saudi Araabia', 'Uruguay', 2),
    ('Iraan', 'Uus-Meremaa', 2),
    ('Prantsusmaa', 'Senegal', 3),
    ('Iraak', 'Norra', 3),
    ('Argentina', 'Alžeeria', 3),
    ('Austria', 'Jordaania', 3),
    ('Portugal', 'Kongo DV', 3),
    ('Inglismaa', 'Horvaatia', 3),
    ('Ghana', 'Panama', 3),
    ('Usbekistan', 'Colombia', 3),
    ('Tšehhi', 'Lõuna-Aafrika', 4),
    ('Šveits', 'Bosnia ja Hertsegoviina', 4),
    ('Kanada', 'Katar', 4),
    ('Mehhiko', 'Lõuna-Korea', 4),
    ('USA', 'Austraalia', 4),
    ('Šotimaa', 'Maroko', 4),
    ('Brasiilia', 'Haiti', 4),
    ('Türgi', 'Paraguay', 4),
    ('Holland', 'Rootsi', 5),
    ('Saksamaa', 'Elevandiluurannik', 5),
    ('Ecuador', 'Curaçao', 5),
    ('Tuneesia', 'Jaapan', 5),
    ('Hispaania', 'Saudi Araabia', 5),
    ('Belgia', 'Iraan', 5),
    ('Uruguay', 'Roheneemesaared', 5),
    ('Uus-Meremaa', 'Egiptus', 5),
    ('Argentina', 'Austria', 6),
    ('Prantsusmaa', 'Iraak', 6),
    ('Norra', 'Senegal', 6),
    ('Jordaania', 'Alžeeria', 6),
    ('Portugal', 'Usbekistan', 6),
    ('Inglismaa', 'Ghana', 6),
    ('Panama', 'Horvaatia', 6),
    ('Colombia', 'Kongo DV', 6),
    ('Šveits', 'Kanada', 7),
    ('Bosnia ja Hertsegoviina', 'Katar', 7),
    ('Šotimaa', 'Brasiilia', 7),
    ('Maroko', 'Haiti', 7),
    ('Tšehhi', 'Mehhiko', 7),
    ('Lõuna-Aafrika', 'Lõuna-Korea', 7),
    ('Curaçao', 'Elevandiluurannik', 8),
    ('Ecuador', 'Saksamaa', 8),
    ('Jaapan', 'Rootsi', 8),
    ('Tuneesia', 'Holland', 8),
    ('Türgi', 'USA', 8),
    ('Paraguay', 'Austraalia', 8),
    ('Norra', 'Prantsusmaa', 9),
    ('Senegal', 'Iraak', 9),
    ('Roheneemesaared', 'Saudi Araabia', 9),
    ('Uruguay', 'Hispaania', 9),
    ('Egiptus', 'Iraan', 9),
    ('Uus-Meremaa', 'Belgia', 9),
    ('Panama', 'Inglismaa', 10),
    ('Horvaatia', 'Ghana', 10),
    ('Colombia', 'Portugal', 10),
    ('Kongo DV', 'Usbekistan', 10),
    ('Alžeeria', 'Austria', 10),
    ('Jordaania', 'Argentina', 10)
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
    (1, 1),
    (2, 1),
    (3, 1),
    (4, 1),
    (5, 1),
    (6, 1),
    (7, 1),
    (8, 1),
    (9, 2),
    (10, 2),
    (11, 2),
    (12, 2),
    (13, 2),
    (14, 2),
    (15, 2),
    (16, 2),
    (17, 3),
    (18, 3),
    (19, 3),
    (20, 3),
    (21, 3),
    (22, 3),
    (23, 3),
    (24, 3),
    (25, 4),
    (26, 4),
    (27, 4),
    (28, 4),
    (29, 4),
    (30, 4),
    (31, 4),
    (32, 4),
    (33, 5),
    (34, 5),
    (35, 5),
    (36, 5),
    (37, 5),
    (38, 5),
    (39, 5),
    (40, 5),
    (41, 6),
    (42, 6),
    (43, 6),
    (44, 6),
    (45, 6),
    (46, 6),
    (47, 6),
    (48, 6),
    (49, 7),
    (50, 7),
    (51, 7),
    (52, 7),
    (53, 7),
    (54, 7),
    (55, 8),
    (56, 8),
    (57, 8),
    (58, 8),
    (59, 8),
    (60, 8),
    (61, 9),
    (62, 9),
    (63, 9),
    (64, 9),
    (65, 9),
    (66, 9),
    (67, 10),
    (68, 10),
    (69, 10),
    (70, 10),
    (71, 10),
    (72, 10)
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
