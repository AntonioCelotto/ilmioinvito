alter table public.rsvps
  add column if not exists response_group_id uuid,
  add column if not exists contact_phone text,
  add column if not exists additional_info text;

update public.rsvps
set response_group_id = gen_random_uuid()
where response_group_id is null;

alter table public.rsvps
  alter column response_group_id set default gen_random_uuid(),
  alter column response_group_id set not null;

create index if not exists rsvps_response_group_id_idx
on public.rsvps(response_group_id);

create index if not exists rsvps_created_at_idx
on public.rsvps(created_at desc);

drop policy if exists "rsvps_public_insert_published" on public.rsvps;

create policy "rsvps_public_insert_enabled"
on public.rsvps for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.invitations
    where invitations.id = rsvps.invitation_id
      and invitations.public_rsvp_enabled = true
  )
);
