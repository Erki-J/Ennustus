-- Eemalba testmängud (legacy) ja nende ennustused
-- Käivita Supabase SQL Editoris

delete from public.match_predictions
where match_id in (
  select m.id
  from public.matches m
  join public.tournaments t on t.id = m.tournament_id
  where t.slug = 'wc-2026'
    and m.stage = 'legacy'
);

delete from public.matches
where tournament_id in (select id from public.tournaments where slug = 'wc-2026')
  and stage = 'legacy';
