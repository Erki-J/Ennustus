-- Käivita kui kõik mängud on "Lukus" (kickoff on minevikus)
-- Täna: 2026-06-29 — tulevased mängud liiguvad juulisse

update public.matches
set kickoff_at = '2026-07-02 18:00:00+00', status = 'scheduled', home_score = null, away_score = null
where home_team = 'Mehhiko' and away_team = 'Sudaan';

update public.matches
set kickoff_at = '2026-07-05 20:00:00+00', status = 'scheduled', home_score = null, away_score = null
where home_team = 'USA' and away_team = 'Colombia';

update public.matches
set kickoff_at = '2026-07-08 17:00:00+00', status = 'scheduled', home_score = null, away_score = null
where home_team = 'Saksamaa' and away_team = 'Jaapan';

-- Lõppenud mängud jäävad minevikku (edetabeli testimiseks)
-- Eesti–Hispaania ja Brasiilia–Prantsusmaa: muutmata
