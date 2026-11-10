create table public.operator_fonts (
  id uuid primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 80),
  format text not null check(format in ('woff2','woff','ttf','otf')),
  storage_path text not null unique,
  file_size integer not null check(file_size>0 and file_size<=2097152),
  license_confirmed_at timestamptz not null,
  created_at timestamptz not null default now(),
  check(storage_path=owner_id::text||'/'||id::text||'.'||format)
);
create index operator_fonts_owner_idx on public.operator_fonts(owner_id);
alter table public.operator_fonts enable row level security;
create policy operator_fonts_select_own on public.operator_fonts for select to authenticated using(owner_id=(select auth.uid()));
revoke all on public.operator_fonts from anon,authenticated;
grant select on public.operator_fonts to authenticated;
grant all on public.operator_fonts to service_role;
-- Files must be readable by guests when embedded in a public invitation.
-- No client list/write/delete policy: uploads and the private catalogue use the
-- authenticated server endpoint, which checks operator approval and ownership.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('invitation-custom-fonts','invitation-custom-fonts',true,2097152,array['font/woff2','font/woff','font/ttf','font/otf']);
