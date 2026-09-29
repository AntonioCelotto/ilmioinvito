insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'invitation-template-videos',
  'invitation-template-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "template videos insert own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'invitation-template-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "template videos select own folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'invitation-template-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "template videos delete own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'invitation-template-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
