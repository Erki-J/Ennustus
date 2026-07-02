-- Parandab wc-2026 väljalangemismängude FIFA numbrid (sort_order 73–104).
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
    (73, 'Lõuna-Aafrika', 'Kanada', '2026-06-28T19:00:00+00', 'round_32', 1, null),
    (74, 'Saksamaa', 'Paraguay', '2026-06-29T20:30:00+00', 'round_32', 1, null),
    (75, 'Holland', 'Maroko', '2026-06-30T01:00:00+00', 'round_32', 1, null),
    (76, 'Brasiilia', 'Jaapan', '2026-06-29T17:00:00+00', 'round_32', 1, null),
    (77, 'Prantsusmaa', 'Rootsi', '2026-06-30T21:00:00+00', 'round_32', 1, null),
    (78, 'Elevandiluurannik', 'Norra', '2026-06-30T17:00:00+00', 'round_32', 1, null),
    (79, 'Mehhiko', 'Ecuador', '2026-07-01T01:00:00+00', 'round_32', 1, null),
    (80, 'Inglismaa', 'Kongo DV', '2026-07-01T16:00:00+00', 'round_32', 1, null),
    (81, 'USA', 'Bosnia ja Hertsegoviina', '2026-07-02T00:00:00+00', 'round_32', 1, null),
    (82, 'Belgia', 'Senegal', '2026-07-01T20:00:00+00', 'round_32', 1, null),
    (83, 'Portugal', 'Horvaatia', '2026-07-02T23:00:00+00', 'round_32', 1, null),
    (84, 'Hispaania', 'Austria', '2026-07-02T19:00:00+00', 'round_32', 1, null),
    (85, 'Šveits', 'Alžeeria', '2026-07-03T03:00:00+00', 'round_32', 1, null),
    (86, 'Argentina', 'Roheneemesaared', '2026-07-03T22:00:00+00', 'round_32', 1, null),
    (87, 'Colombia', 'Ghana', '2026-07-04T01:30:00+00', 'round_32', 1, null),
    (88, 'Austraalia', 'Egiptus', '2026-07-03T18:00:00+00', 'round_32', 1, null),
    (89, 'Tundmatu', 'Tundmatu', '2026-07-04T21:00:00+00', 'round_16', 1, null),
    (90, 'Kanada', 'Tundmatu', '2026-07-04T17:00:00+00', 'round_16', 1, null),
    (91, 'Tundmatu', 'Tundmatu', '2026-07-05T20:00:00+00', 'round_16', 1, null),
    (92, 'Tundmatu', 'Tundmatu', '2026-07-06T00:00:00+00', 'round_16', 1, null),
    (93, 'Tundmatu', 'Tundmatu', '2026-07-06T19:00:00+00', 'round_16', 1, null),
    (94, 'Tundmatu', 'Tundmatu', '2026-07-07T00:00:00+00', 'round_16', 1, null),
    (95, 'Tundmatu', 'Tundmatu', '2026-07-07T16:00:00+00', 'round_16', 1, null),
    (96, 'Tundmatu', 'Tundmatu', '2026-07-07T20:00:00+00', 'round_16', 1, null),
    (97, 'Tundmatu', 'Tundmatu', '2026-07-09T20:00:00+00', 'quarter', 1, null),
    (98, 'Tundmatu', 'Tundmatu', '2026-07-10T19:00:00+00', 'quarter', 1, null),
    (99, 'Tundmatu', 'Tundmatu', '2026-07-11T21:00:00+00', 'quarter', 1, null),
    (100, 'Tundmatu', 'Tundmatu', '2026-07-12T01:00:00+00', 'quarter', 1, null),
    (101, 'Tundmatu', 'Tundmatu', '2026-07-14T19:00:00+00', 'semi', 1, null),
    (102, 'Tundmatu', 'Tundmatu', '2026-07-15T19:00:00+00', 'semi', 1, null),
    (103, 'L101', 'L102', '2026-07-18T21:00:00+00', 'third', 1, null),
    (104, 'Tundmatu', 'Tundmatu', '2026-07-19T19:00:00+00', 'final', 1, null)
) as v(sort_order, home_team, away_team, kickoff_at, stage, matchday, group_code)
where m.tournament_id = t.id
  and t.slug = 'wc-2026'
  and m.stage = v.stage
  and m.kickoff_at = v.kickoff_at::timestamptz;
