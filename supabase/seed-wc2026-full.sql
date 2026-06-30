-- Täispikk Jalgpalli MM 2026 ajakava (104 mängu)
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
    ('Mehhiko', 'Lõuna-Aafrika', '2026-06-11T19:00:00+00', 'group', 1, 'A', 1, 2, 0, 'finished'::public.match_status),
    ('Lõuna-Korea', 'Tšehhi', '2026-06-12T02:00:00+00', 'group', 1, 'A', 2, 2, 1, 'finished'::public.match_status),
    ('Kanada', 'Bosnia ja Hertsegoviina', '2026-06-12T19:00:00+00', 'group', 1, 'B', 3, 1, 1, 'finished'::public.match_status),
    ('USA', 'Paraguay', '2026-06-13T01:00:00+00', 'group', 1, 'D', 4, 4, 1, 'finished'::public.match_status),
    ('Katar', 'Šveits', '2026-06-13T19:00:00+00', 'group', 1, 'B', 5, 1, 1, 'finished'::public.match_status),
    ('Brasiilia', 'Maroko', '2026-06-13T22:00:00+00', 'group', 1, 'C', 6, 1, 1, 'finished'::public.match_status),
    ('Haiti', 'Šotimaa', '2026-06-14T01:00:00+00', 'group', 1, 'C', 7, 0, 1, 'finished'::public.match_status),
    ('Austraalia', 'Türgi', '2026-06-14T04:00:00+00', 'group', 1, 'D', 8, 2, 0, 'finished'::public.match_status),
    ('Saksamaa', 'Curaçao', '2026-06-14T17:00:00+00', 'group', 2, 'E', 9, 7, 1, 'finished'::public.match_status),
    ('Holland', 'Jaapan', '2026-06-14T20:00:00+00', 'group', 2, 'F', 10, 2, 2, 'finished'::public.match_status),
    ('Elevandiluurannik', 'Ecuador', '2026-06-14T23:00:00+00', 'group', 2, 'E', 11, 1, 0, 'finished'::public.match_status),
    ('Rootsi', 'Tuneesia', '2026-06-15T02:00:00+00', 'group', 2, 'F', 12, 5, 1, 'finished'::public.match_status),
    ('Hispaania', 'Roheneemesaared', '2026-06-15T16:00:00+00', 'group', 2, 'H', 13, 0, 0, 'finished'::public.match_status),
    ('Belgia', 'Egiptus', '2026-06-15T19:00:00+00', 'group', 2, 'G', 14, 1, 1, 'finished'::public.match_status),
    ('Saudi Araabia', 'Uruguay', '2026-06-15T22:00:00+00', 'group', 2, 'H', 15, 1, 1, 'finished'::public.match_status),
    ('Iraan', 'Uus-Meremaa', '2026-06-16T01:00:00+00', 'group', 2, 'G', 16, 2, 2, 'finished'::public.match_status),
    ('Prantsusmaa', 'Senegal', '2026-06-16T19:00:00+00', 'group', 3, 'I', 17, 3, 1, 'finished'::public.match_status),
    ('Iraak', 'Norra', '2026-06-16T22:00:00+00', 'group', 3, 'I', 18, 1, 4, 'finished'::public.match_status),
    ('Argentina', 'Alžeeria', '2026-06-17T01:00:00+00', 'group', 3, 'J', 19, 3, 0, 'finished'::public.match_status),
    ('Austria', 'Jordaania', '2026-06-17T04:00:00+00', 'group', 3, 'J', 20, 3, 1, 'finished'::public.match_status),
    ('Portugal', 'Kongo DV', '2026-06-17T17:00:00+00', 'group', 3, 'K', 21, 1, 1, 'finished'::public.match_status),
    ('Inglismaa', 'Horvaatia', '2026-06-17T20:00:00+00', 'group', 3, 'L', 22, 4, 2, 'finished'::public.match_status),
    ('Ghana', 'Panama', '2026-06-17T23:00:00+00', 'group', 3, 'L', 23, 1, 0, 'finished'::public.match_status),
    ('Usbekistan', 'Colombia', '2026-06-18T02:00:00+00', 'group', 3, 'K', 24, 1, 3, 'finished'::public.match_status),
    ('Tšehhi', 'Lõuna-Aafrika', '2026-06-18T16:00:00+00', 'group', 4, 'A', 25, 1, 1, 'finished'::public.match_status),
    ('Šveits', 'Bosnia ja Hertsegoviina', '2026-06-18T19:00:00+00', 'group', 4, 'B', 26, 4, 1, 'finished'::public.match_status),
    ('Kanada', 'Katar', '2026-06-18T22:00:00+00', 'group', 4, 'B', 27, 6, 0, 'finished'::public.match_status),
    ('Mehhiko', 'Lõuna-Korea', '2026-06-19T01:00:00+00', 'group', 4, 'A', 28, 1, 0, 'finished'::public.match_status),
    ('USA', 'Austraalia', '2026-06-19T19:00:00+00', 'group', 4, 'D', 29, 2, 0, 'finished'::public.match_status),
    ('Šotimaa', 'Maroko', '2026-06-19T22:00:00+00', 'group', 4, 'C', 30, 0, 1, 'finished'::public.match_status),
    ('Brasiilia', 'Haiti', '2026-06-20T00:30:00+00', 'group', 4, 'C', 31, 3, 0, 'finished'::public.match_status),
    ('Türgi', 'Paraguay', '2026-06-20T03:00:00+00', 'group', 4, 'D', 32, 0, 1, 'finished'::public.match_status),
    ('Holland', 'Rootsi', '2026-06-20T17:00:00+00', 'group', 5, 'F', 33, 5, 1, 'finished'::public.match_status),
    ('Saksamaa', 'Elevandiluurannik', '2026-06-20T20:00:00+00', 'group', 5, 'E', 34, 2, 1, 'finished'::public.match_status),
    ('Ecuador', 'Curaçao', '2026-06-21T00:00:00+00', 'group', 5, 'E', 35, 0, 0, 'finished'::public.match_status),
    ('Tuneesia', 'Jaapan', '2026-06-21T04:00:00+00', 'group', 5, 'F', 36, 0, 4, 'finished'::public.match_status),
    ('Hispaania', 'Saudi Araabia', '2026-06-21T16:00:00+00', 'group', 5, 'H', 37, 4, 0, 'finished'::public.match_status),
    ('Belgia', 'Iraan', '2026-06-21T19:00:00+00', 'group', 5, 'G', 38, 0, 0, 'finished'::public.match_status),
    ('Uruguay', 'Roheneemesaared', '2026-06-21T22:00:00+00', 'group', 5, 'H', 39, 2, 2, 'finished'::public.match_status),
    ('Uus-Meremaa', 'Egiptus', '2026-06-22T01:00:00+00', 'group', 5, 'G', 40, 1, 3, 'finished'::public.match_status),
    ('Argentina', 'Austria', '2026-06-22T17:00:00+00', 'group', 6, 'J', 41, 2, 0, 'finished'::public.match_status),
    ('Prantsusmaa', 'Iraak', '2026-06-22T21:00:00+00', 'group', 6, 'I', 42, 3, 0, 'finished'::public.match_status),
    ('Norra', 'Senegal', '2026-06-23T00:00:00+00', 'group', 6, 'I', 43, 3, 2, 'finished'::public.match_status),
    ('Jordaania', 'Alžeeria', '2026-06-23T03:00:00+00', 'group', 6, 'J', 44, 1, 2, 'finished'::public.match_status),
    ('Portugal', 'Usbekistan', '2026-06-23T17:00:00+00', 'group', 6, 'K', 45, 5, 0, 'finished'::public.match_status),
    ('Inglismaa', 'Ghana', '2026-06-23T20:00:00+00', 'group', 6, 'L', 46, 0, 0, 'finished'::public.match_status),
    ('Panama', 'Horvaatia', '2026-06-23T23:00:00+00', 'group', 6, 'L', 47, 0, 1, 'finished'::public.match_status),
    ('Colombia', 'Kongo DV', '2026-06-24T02:00:00+00', 'group', 6, 'K', 48, 1, 0, 'finished'::public.match_status),
    ('Šveits', 'Kanada', '2026-06-24T19:00:00+00', 'group', 7, 'B', 49, 2, 1, 'finished'::public.match_status),
    ('Bosnia ja Hertsegoviina', 'Katar', '2026-06-24T19:00:00+00', 'group', 7, 'B', 50, 3, 1, 'finished'::public.match_status),
    ('Šotimaa', 'Brasiilia', '2026-06-24T22:00:00+00', 'group', 7, 'C', 51, 0, 3, 'finished'::public.match_status),
    ('Maroko', 'Haiti', '2026-06-24T22:00:00+00', 'group', 7, 'C', 52, 4, 2, 'finished'::public.match_status),
    ('Tšehhi', 'Mehhiko', '2026-06-25T01:00:00+00', 'group', 7, 'A', 53, 0, 3, 'finished'::public.match_status),
    ('Lõuna-Aafrika', 'Lõuna-Korea', '2026-06-25T01:00:00+00', 'group', 7, 'A', 54, 1, 0, 'finished'::public.match_status),
    ('Curaçao', 'Elevandiluurannik', '2026-06-25T20:00:00+00', 'group', 8, 'E', 55, 0, 2, 'finished'::public.match_status),
    ('Ecuador', 'Saksamaa', '2026-06-25T20:00:00+00', 'group', 8, 'E', 56, 2, 1, 'finished'::public.match_status),
    ('Jaapan', 'Rootsi', '2026-06-25T23:00:00+00', 'group', 8, 'F', 57, 1, 1, 'finished'::public.match_status),
    ('Tuneesia', 'Holland', '2026-06-25T23:00:00+00', 'group', 8, 'F', 58, 1, 3, 'finished'::public.match_status),
    ('Türgi', 'USA', '2026-06-26T02:00:00+00', 'group', 8, 'D', 59, 3, 2, 'finished'::public.match_status),
    ('Paraguay', 'Austraalia', '2026-06-26T02:00:00+00', 'group', 8, 'D', 60, 0, 0, 'finished'::public.match_status),
    ('Norra', 'Prantsusmaa', '2026-06-26T19:00:00+00', 'group', 9, 'I', 61, 1, 4, 'finished'::public.match_status),
    ('Senegal', 'Iraak', '2026-06-26T19:00:00+00', 'group', 9, 'I', 62, 5, 0, 'finished'::public.match_status),
    ('Roheneemesaared', 'Saudi Araabia', '2026-06-27T00:00:00+00', 'group', 9, 'H', 63, 0, 0, 'finished'::public.match_status),
    ('Uruguay', 'Hispaania', '2026-06-27T00:00:00+00', 'group', 9, 'H', 64, 0, 1, 'finished'::public.match_status),
    ('Egiptus', 'Iraan', '2026-06-27T03:00:00+00', 'group', 9, 'G', 65, 1, 1, 'finished'::public.match_status),
    ('Uus-Meremaa', 'Belgia', '2026-06-27T03:00:00+00', 'group', 9, 'G', 66, 1, 5, 'finished'::public.match_status),
    ('Panama', 'Inglismaa', '2026-06-27T21:00:00+00', 'group', 10, 'L', 67, 0, 2, 'finished'::public.match_status),
    ('Horvaatia', 'Ghana', '2026-06-27T21:00:00+00', 'group', 10, 'L', 68, 2, 1, 'finished'::public.match_status),
    ('Colombia', 'Portugal', '2026-06-27T23:30:00+00', 'group', 10, 'K', 69, 0, 0, 'finished'::public.match_status),
    ('Kongo DV', 'Usbekistan', '2026-06-27T23:30:00+00', 'group', 10, 'K', 70, 3, 1, 'finished'::public.match_status),
    ('Alžeeria', 'Austria', '2026-06-28T02:00:00+00', 'group', 10, 'J', 71, 3, 3, 'finished'::public.match_status),
    ('Jordaania', 'Argentina', '2026-06-28T02:00:00+00', 'group', 10, 'J', 72, 1, 3, 'finished'::public.match_status),
    ('Lõuna-Aafrika', 'Kanada', '2026-06-28T19:00:00+00', 'round_32', 1, null, 73, 0, 1, 'finished'::public.match_status),
    ('Brasiilia', 'Jaapan', '2026-06-29T17:00:00+00', 'round_32', 1, null, 74, 2, 1, 'finished'::public.match_status),
    ('Saksamaa', 'Paraguay', '2026-06-29T20:30:00+00', 'round_32', 1, null, 75, null::int, null::int, 'scheduled'::public.match_status),
    ('Holland', 'Maroko', '2026-06-30T01:00:00+00', 'round_32', 1, null, 76, null::int, null::int, 'scheduled'::public.match_status),
    ('Elevandiluurannik', 'Norra', '2026-06-30T17:00:00+00', 'round_32', 1, null, 77, null::int, null::int, 'scheduled'::public.match_status),
    ('Prantsusmaa', 'Rootsi', '2026-06-30T21:00:00+00', 'round_32', 1, null, 78, null::int, null::int, 'scheduled'::public.match_status),
    ('Mehhiko', 'Ecuador', '2026-07-01T01:00:00+00', 'round_32', 1, null, 79, null::int, null::int, 'scheduled'::public.match_status),
    ('Inglismaa', 'Kongo DV', '2026-07-01T16:00:00+00', 'round_32', 1, null, 80, null::int, null::int, 'scheduled'::public.match_status),
    ('Belgia', 'Senegal', '2026-07-01T20:00:00+00', 'round_32', 1, null, 81, null::int, null::int, 'scheduled'::public.match_status),
    ('USA', 'Bosnia ja Hertsegoviina', '2026-07-02T00:00:00+00', 'round_32', 1, null, 82, null::int, null::int, 'scheduled'::public.match_status),
    ('Hispaania', 'Austria', '2026-07-02T19:00:00+00', 'round_32', 1, null, 83, null::int, null::int, 'scheduled'::public.match_status),
    ('Portugal', 'Horvaatia', '2026-07-02T23:00:00+00', 'round_32', 1, null, 84, null::int, null::int, 'scheduled'::public.match_status),
    ('Šveits', 'Alžeeria', '2026-07-03T03:00:00+00', 'round_32', 1, null, 85, null::int, null::int, 'scheduled'::public.match_status),
    ('Austraalia', 'Egiptus', '2026-07-03T18:00:00+00', 'round_32', 1, null, 86, null::int, null::int, 'scheduled'::public.match_status),
    ('Argentina', 'Roheneemesaared', '2026-07-03T22:00:00+00', 'round_32', 1, null, 87, null::int, null::int, 'scheduled'::public.match_status),
    ('Colombia', 'Ghana', '2026-07-04T01:30:00+00', 'round_32', 1, null, 88, null::int, null::int, 'scheduled'::public.match_status),
    ('Kanada', 'Tundmatu', '2026-07-04T17:00:00+00', 'round_16', 1, null, 89, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-04T21:00:00+00', 'round_16', 1, null, 90, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-05T20:00:00+00', 'round_16', 1, null, 91, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-06T00:00:00+00', 'round_16', 1, null, 92, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-06T19:00:00+00', 'round_16', 1, null, 93, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-07T00:00:00+00', 'round_16', 1, null, 94, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-07T16:00:00+00', 'round_16', 1, null, 95, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-07T20:00:00+00', 'round_16', 1, null, 96, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-09T20:00:00+00', 'quarter', 1, null, 97, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-10T19:00:00+00', 'quarter', 1, null, 98, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-11T21:00:00+00', 'quarter', 1, null, 99, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-12T01:00:00+00', 'quarter', 1, null, 100, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-14T19:00:00+00', 'semi', 1, null, 101, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-15T19:00:00+00', 'semi', 1, null, 102, null::int, null::int, 'scheduled'::public.match_status),
    ('L101', 'L102', '2026-07-18T21:00:00+00', 'third', 1, null, 103, null::int, null::int, 'scheduled'::public.match_status),
    ('Tundmatu', 'Tundmatu', '2026-07-19T19:00:00+00', 'final', 1, null, 104, null::int, null::int, 'scheduled'::public.match_status)
) as v(home_team, away_team, kickoff_at, stage, matchday, group_code, sort_order, home_score, away_score, status)
where t.slug = 'wc-2026';
