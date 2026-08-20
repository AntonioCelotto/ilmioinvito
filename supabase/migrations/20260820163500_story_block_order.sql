alter table public.invitation_content
  add column if not exists story_position integer not null default 0;

alter type public.invitation_section_type add value if not exists 'story';

insert into public.invitation_sections (invitation_id, type, title, enabled, sort_order)
select i.id, 'story'::public.invitation_section_type, 'story', true, 0
from public.invitations i
where not exists (
  select 1 from public.invitation_sections s
  where s.invitation_id = i.id
    and s.type = 'story'::public.invitation_section_type
);

update public.invitation_sections s
set sort_order = s.sort_order + 1
where s.type <> 'story'::public.invitation_section_type
and exists (
  select 1 from public.invitation_sections story
  where story.invitation_id = s.invitation_id
    and story.type = 'story'::public.invitation_section_type
);

delete from public.invitation_sections a
using public.invitation_sections b
where a.invitation_id = b.invitation_id
  and a.type = 'story'::public.invitation_section_type
  and b.type = 'story'::public.invitation_section_type
  and a.id > b.id;

create unique index if not exists invitation_sections_one_story_per_invitation
on public.invitation_sections(invitation_id)
where type = 'story'::public.invitation_section_type;

create or replace function public.ensure_story_sections_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.invitation_sections(invitation_id, type, title, enabled, sort_order)
  select distinct d.invitation_id, 'story'::public.invitation_section_type, 'story', true, 0
  from deleted_sections d
  where exists (select 1 from public.invitations i where i.id = d.invitation_id)
  on conflict (invitation_id) where type = 'story'::public.invitation_section_type do nothing;
  return null;
end;
$$;

drop trigger if exists keep_story_sections_after_delete on public.invitation_sections;
create trigger keep_story_sections_after_delete
after delete on public.invitation_sections
referencing old table as deleted_sections
for each statement execute function public.ensure_story_sections_after_delete();
