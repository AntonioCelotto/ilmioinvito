alter table public.invitation_content
  add column if not exists gift_iban text,
  add column if not exists gift_wishes jsonb not null default '[]'::jsonb;

create table if not exists public.guest_media (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_name text not null,
  dedication text,
  media_type invitation_media_type not null,
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_media_invitation_id_idx
on public.guest_media(invitation_id);

create index if not exists guest_media_status_idx
on public.guest_media(status);

alter table public.guest_media enable row level security;

create policy "guest media owner select"
on public.guest_media for select to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.owner_id = (select auth.uid())
  )
  or status = 'approved'
);

create policy "guest media owner update"
on public.guest_media for update to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.owner_id = (select auth.uid())
  )
);

create policy "guest media owner delete"
on public.guest_media for delete to authenticated
using (
  exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.owner_id = (select auth.uid())
  )
);

create policy "guest media public insert"
on public.guest_media for insert to anon, authenticated
with check (
  status = 'pending'
  and length(trim(guest_name)) between 2 and 120
  and exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.status = 'published'
  )
);

create policy "guest media public approved select"
on public.guest_media for select to anon
using (
  status = 'approved'
  and exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.status = 'published'
  )
);

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'invitation-guest-media',
  'invitation-guest-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "guest media files public insert"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'invitation-guest-media'
  and exists (
    select 1 from public.invitations
    where invitations.id::text = (storage.foldername(name))[1]
      and invitations.status = 'published'
  )
);

create policy "guest media files owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'invitation-guest-media'
  and exists (
    select 1 from public.invitations
    where invitations.id::text = (storage.foldername(name))[1]
      and invitations.owner_id = (select auth.uid())
  )
);
