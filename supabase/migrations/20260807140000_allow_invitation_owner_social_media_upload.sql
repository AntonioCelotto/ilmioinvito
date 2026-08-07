create policy "guest media files owner insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'invitation-guest-media'
  and exists (
    select 1
    from public.invitations
    where invitations.id::text = (storage.foldername(name))[1]
      and invitations.owner_id = (select auth.uid())
  )
);
