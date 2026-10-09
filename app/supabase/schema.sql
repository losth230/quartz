-- ══════════════════════════════════════════════════════════════════════
--  CHASSE & PÊCHE — Schéma Supabase (multijoueur temps réel, sans auth)
--  Exécutez ce script dans le SQL Editor de votre projet Supabase.
--  Principe : un salon = une ligne dans `parties` contenant l'état JSON
--  complet du jeu. Les 8 joueurs lisent/écrivent en anonyme (RLS ouverte)
--  et reçoivent les mises à jour via Realtime.
-- ══════════════════════════════════════════════════════════════════════

create table if not exists public.parties (
  id         text primary key,          -- code du salon (ex: 'chasse-1')
  state      jsonb not null,            -- GameState complet
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.parties enable row level security;

-- RLS ouverte : les joueurs sont identifiés par le code du salon.
-- ⚠️ N'utilisez pas de code devinable si vous jouez en public.
drop policy if exists "anon lecture" on public.parties;
create policy "anon lecture"
  on public.parties for select
  to anon using (true);

drop policy if exists "anon ecriture" on public.parties;
create policy "anon ecriture"
  on public.parties for insert
  to anon with check (true);

drop policy if exists "anon maj" on public.parties;
create policy "anon maj"
  on public.parties for update
  to anon using (true) with check (true);

-- Realtime : diffusion des mises à jour d'une partie
do $$
begin
  begin
    alter publication supabase_realtime add table public.parties;
  exception
    when duplicate_object then null; -- déjà ajoutée
  end;
end $$;

-- Rétention d'usage : mettre à jour le timestamp
create or replace function public.touch_partie()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists touch_partie on public.parties;
create trigger touch_partie
  before update on public.parties
  for each row execute function public.touch_partie();
