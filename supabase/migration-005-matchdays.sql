-- Käivita Supabase SQL Editoris PÄRAST migration-004-bonus.sql
-- Lisab mängupäevade (matchday) toe — nagu Kicktipp Matchday 1, 2, … ja väljalangemismängud

alter table public.matches
  add column if not exists matchday int not null default 1,
  add column if not exists group_code text;

create index if not exists matches_tournament_matchday_idx
  on public.matches (tournament_id, stage, matchday, sort_order);

-- Olemasolevad näidismängud: iga mäng oma mängupäev (testimiseks)
update public.matches
set
  matchday = sort_order,
  group_code = case sort_order
    when 1 then 'A'
    when 2 then 'B'
    when 3 then 'E'
    when 4 then 'F'
    when 5 then 'G'
    else group_code
  end
where tournament_id in (select id from public.tournaments where slug = 'wc-2026');
