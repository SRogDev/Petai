-- ============================================================================
-- Petai · Supabase schema — day-1 system of record
-- ============================================================================
-- How to apply: create your Supabase project, open the SQL editor,
-- paste this file and run it. It is idempotent-ish (safe to re-run the
-- table/policy sections; extension + trigger creation use IF NOT EXISTS).
--
-- Design notes (see docs/04-architecture.md):
--  * `pets` is the aggregate root. Appearance / personality / preferences /
--    origin are JSONB: the creature generator defines their shape, the DB
--    does not freeze it.
--  * Needs are normalized (pet_needs) because the simulation reads/writes
--    them constantly and RLS stays simple.
--  * Everything is owner-scoped via RLS. The FastAPI service uses the
--    service_role key and bypasses RLS; the web client uses the anon key
--    and only ever sees its owner's rows.
-- ============================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- pets — the creature aggregate
-- --------------------------------------------------------------------------
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  species text not null,
  appearance jsonb not null default '{}'::jsonb,
  personality jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  origin jsonb not null default '{}'::jsonb,
  need_model text[] not null default array[
    'hunger','energy','happiness','social',
    'stimulation','affection','cleanliness','curiosity'
  ],
  mood text not null default 'content',
  activity text not null default 'waking up',
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists pets_owner_idx on public.pets (owner_id);

-- --------------------------------------------------------------------------
-- pet_needs — simulated internal state (0-100), owned by the simulation
-- --------------------------------------------------------------------------
create table if not exists public.pet_needs (
  pet_id uuid not null references public.pets (id) on delete cascade,
  key text not null,
  value numeric not null default 70 check (value >= 0 and value <= 100),
  updated_at timestamptz not null default now(),
  primary key (pet_id, key)
);
create index if not exists pet_needs_pet_idx on public.pet_needs (pet_id);

-- --------------------------------------------------------------------------
-- pet_memories — meaningful experiences, not every interaction
-- --------------------------------------------------------------------------
create table if not exists public.pet_memories (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  content text not null,
  significance numeric not null default 0.5 check (significance >= 0 and significance <= 1),
  created_at timestamptz not null default now()
);
create index if not exists pet_memories_pet_idx on public.pet_memories (pet_id, created_at desc);

-- --------------------------------------------------------------------------
-- pet_events — the "while you were away" feed
-- --------------------------------------------------------------------------
create table if not exists public.pet_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  media_url text,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists pet_events_pet_idx on public.pet_events (pet_id, created_at desc);

-- --------------------------------------------------------------------------
-- pet_media — things the creature generated (Pet Event -> Media)
-- --------------------------------------------------------------------------
create table if not exists public.pet_media (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  kind text not null check (kind in ('image','video','meme','audio')),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index if not exists pet_media_pet_idx on public.pet_media (pet_id, created_at desc);

-- --------------------------------------------------------------------------
-- pet_relationships — pets have relationships with each other, not owners
-- --------------------------------------------------------------------------
create table if not exists public.pet_relationships (
  pet_a uuid not null references public.pets (id) on delete cascade,
  pet_b uuid not null references public.pets (id) on delete cascade,
  check (pet_a < pet_b),
  score numeric not null default 50 check (score >= 0 and score <= 100),
  status text not null default 'acquaintances'
    check (status in ('acquaintances','friends','best_friends','rivals','wary')),
  met_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (pet_a, pet_b)
);

-- --------------------------------------------------------------------------
-- physical_sessions — every physical-world interaction is logged
-- --------------------------------------------------------------------------
create table if not exists public.physical_sessions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  capability_id text not null,
  context jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists physical_sessions_pet_idx on public.physical_sessions (pet_id, started_at desc);

-- --------------------------------------------------------------------------
-- updated_at maintenance
-- --------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists pets_touch on public.pets;
create trigger pets_touch before update on public.pets
  for each row execute function public.touch_updated_at();

drop trigger if exists rel_touch on public.pet_relationships;
create trigger rel_touch before update on public.pet_relationships
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
-- auto-create profile on signup
-- --------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- Row Level Security — owner-scoped everything
-- --------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_needs enable row level security;
alter table public.pet_memories enable row level security;
alter table public.pet_events enable row level security;
alter table public.pet_media enable row level security;
alter table public.pet_relationships enable row level security;
alter table public.physical_sessions enable row level security;

create or replace function public.is_pet_owner(p_pet_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.pets p
    where p.id = p_pet_id and p.owner_id = auth.uid()
  );
$$;

-- profiles
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- pets
drop policy if exists pets_owner on public.pets;
create policy pets_owner on public.pets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- pet_needs
drop policy if exists pet_needs_owner on public.pet_needs;
create policy pet_needs_owner on public.pet_needs
  for all using (public.is_pet_owner(pet_id)) with check (public.is_pet_owner(pet_id));

-- pet_memories
drop policy if exists pet_memories_owner on public.pet_memories;
create policy pet_memories_owner on public.pet_memories
  for all using (public.is_pet_owner(pet_id)) with check (public.is_pet_owner(pet_id));

-- pet_events
drop policy if exists pet_events_owner on public.pet_events;
create policy pet_events_owner on public.pet_events
  for all using (public.is_pet_owner(pet_id)) with check (public.is_pet_owner(pet_id));

-- pet_media
drop policy if exists pet_media_owner on public.pet_media;
create policy pet_media_owner on public.pet_media
  for all using (public.is_pet_owner(pet_id)) with check (public.is_pet_owner(pet_id));

-- pet_relationships: visible if you own either side
drop policy if exists pet_relationships_owner on public.pet_relationships;
create policy pet_relationships_owner on public.pet_relationships
  for all using (
    public.is_pet_owner(pet_a) or public.is_pet_owner(pet_b)
  ) with check (
    public.is_pet_owner(pet_a) or public.is_pet_owner(pet_b)
  );

-- physical_sessions
drop policy if exists physical_sessions_owner on public.physical_sessions;
create policy physical_sessions_owner on public.physical_sessions
  for all using (public.is_pet_owner(pet_id)) with check (public.is_pet_owner(pet_id));

-- --------------------------------------------------------------------------
-- Storage — public bucket for creature-generated media
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pet-media', 'pet-media', true)
on conflict (id) do nothing;

drop policy if exists pet_media_read on storage.objects;
create policy pet_media_read on storage.objects
  for select using (bucket_id = 'pet-media');

drop policy if exists pet_media_write on storage.objects;
create policy pet_media_write on storage.objects
  for insert with check (bucket_id = 'pet-media' and auth.role() = 'authenticated');
