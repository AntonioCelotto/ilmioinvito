create type invitation_section_type as enum (
  'countdown',
  'ceremony',
  'reception',
  'rsvp',
  'gallery',
  'video',
  'program',
  'dress_code',
  'gift_info',
  'custom'
);

create type invitation_location_type as enum (
  'main',
  'ceremony',
  'reception',
  'church',
  'other'
);

create type invitation_media_type as enum ('photo', 'video');

create table public.invitation_sections (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  type invitation_section_type not null,
  title text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitation_locations (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  type invitation_location_type not null default 'main',
  name text not null,
  address text,
  maps_url text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitation_media (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  type invitation_media_type not null,
  title text,
  storage_path text,
  external_url text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitation_themes (
  invitation_id uuid primary key references public.invitations(id) on delete cascade,
  template_slug text not null default 'dark-luxury',
  primary_color text not null default '#151313',
  accent_color text not null default '#b87333',
  font_style text not null default 'serif',
  hero_media_id uuid references public.invitation_media(id) on delete set null,
  custom_css jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index invitation_sections_invitation_id_idx on public.invitation_sections(invitation_id);
create index invitation_sections_type_idx on public.invitation_sections(type);
create index invitation_locations_invitation_id_idx on public.invitation_locations(invitation_id);
create index invitation_locations_type_idx on public.invitation_locations(type);
create index invitation_media_invitation_id_idx on public.invitation_media(invitation_id);
create index invitation_media_type_idx on public.invitation_media(type);
create index invitation_themes_hero_media_id_idx on public.invitation_themes(hero_media_id);

alter table public.invitation_sections enable row level security;
alter table public.invitation_locations enable row level security;
alter table public.invitation_media enable row level security;
alter table public.invitation_themes enable row level security;

create policy "sections_owner_all"
on public.invitation_sections for all
to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_sections.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_sections.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
);

create policy "sections_public_select_published"
on public.invitation_sections for select
to anon, authenticated
using (
  enabled = true
  and exists (
    select 1 from public.invitations
    where invitations.id = invitation_sections.invitation_id
    and invitations.status = 'published'
  )
);

create policy "locations_owner_all"
on public.invitation_locations for all
to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_locations.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_locations.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
);

create policy "locations_public_select_published"
on public.invitation_locations for select
to anon, authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_locations.invitation_id
    and invitations.status = 'published'
  )
);

create policy "media_owner_all"
on public.invitation_media for all
to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_media.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_media.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
);

create policy "media_public_select_published"
on public.invitation_media for select
to anon, authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_media.invitation_id
    and invitations.status = 'published'
  )
);

create policy "themes_owner_all"
on public.invitation_themes for all
to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_themes.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_themes.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
);

create policy "themes_public_select_published"
on public.invitation_themes for select
to anon, authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_themes.invitation_id
    and invitations.status = 'published'
  )
);
