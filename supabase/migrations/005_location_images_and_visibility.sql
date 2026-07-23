alter table public.invitation_locations
  add column if not exists enabled boolean not null default true,
  add column if not exists image_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'invitation-location-images',
  'invitation-location-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "location images insert own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'invitation-location-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "location images select own folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'invitation-location-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "location images update own folder"
on storage.objects for update to authenticated
using (
  bucket_id = 'invitation-location-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'invitation-location-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "location images delete own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'invitation-location-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
