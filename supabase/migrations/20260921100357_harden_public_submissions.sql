drop policy if exists "rsvps_public_insert_enabled" on public.rsvps;

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

alter table public.guest_media alter column status set default 'pending';

drop policy if exists "guest media public insert" on public.guest_media;

create policy "guest media public insert pending"
on public.guest_media for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(trim(guest_name)) between 2 and 120
  and exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.status = 'published'
  )
);

drop policy if exists "guest media files public insert" on storage.objects;
