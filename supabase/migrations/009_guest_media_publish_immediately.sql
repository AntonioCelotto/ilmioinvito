alter table public.guest_media
  alter column status set default 'approved';

drop policy if exists "guest media public insert" on public.guest_media;

create policy "guest media public insert"
on public.guest_media for insert to anon, authenticated
with check (
  status = 'approved'
  and length(trim(guest_name)) between 2 and 120
  and exists (
    select 1 from public.invitations
    where invitations.id = guest_media.invitation_id
      and invitations.status = 'published'
  )
);
