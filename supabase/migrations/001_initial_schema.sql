create extension if not exists "pgcrypto";

create type invitation_status as enum ('draft', 'pending_payment', 'published', 'archived');
create type guest_status as enum ('pending', 'confirmed', 'declined');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.templates(id),
  slug text not null unique,
  status invitation_status not null default 'draft',
  title text not null,
  subtitle text,
  host_name text,
  event_date date,
  event_time time,
  venue_name text,
  venue_address text,
  whatsapp_number text,
  public_rsvp_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.invitation_content (
  invitation_id uuid primary key references public.invitations(id) on delete cascade,
  story text,
  dress_code text,
  gift_info text,
  program jsonb not null default '[]'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  status guest_status not null default 'pending',
  party_size integer not null default 1 check (party_size >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  guest_name text not null,
  status guest_status not null,
  party_size integer not null default 1 check (party_size >= 0),
  message text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  provider_checkout_id text,
  provider_payment_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index invitations_owner_id_idx on public.invitations(owner_id);
create index invitations_status_idx on public.invitations(status);
create index guests_invitation_id_idx on public.guests(invitation_id);
create index rsvps_invitation_id_idx on public.rsvps(invitation_id);
create index payments_owner_id_idx on public.payments(owner_id);
create index payments_invitation_id_idx on public.payments(invitation_id);

alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_content enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.payments enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "templates_select_active"
on public.templates for select
to anon, authenticated
using (is_active = true);

create policy "invitations_owner_all"
on public.invitations for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "invitations_public_select_published"
on public.invitations for select
to anon, authenticated
using (status = 'published');

create policy "content_owner_all"
on public.invitation_content for all
to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_content.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_content.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
);

create policy "content_public_select_published"
on public.invitation_content for select
to anon, authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = invitation_content.invitation_id
    and invitations.status = 'published'
  )
);

create policy "guests_owner_all"
on public.guests for all
to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = guests.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = guests.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
);

create policy "rsvps_owner_select"
on public.rsvps for select
to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = rsvps.invitation_id
    and invitations.owner_id = (select auth.uid())
  )
);

create policy "rsvps_public_insert_published"
on public.rsvps for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = rsvps.invitation_id
    and invitations.status = 'published'
    and invitations.public_rsvp_enabled = true
  )
);

create policy "payments_owner_select"
on public.payments for select
to authenticated
using ((select auth.uid()) = owner_id);

insert into public.templates (name, slug, description)
values
  ('Elegante Evento', 'elegante-evento', 'Template mobile-first ispirato al prototipo Dora/Lorenzo.');
