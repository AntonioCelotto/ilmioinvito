begin;
do $$
declare
 actor uuid:=gen_random_uuid(); other_actor uuid:=gen_random_uuid(); font_a uuid:=gen_random_uuid(); font_b uuid:=gen_random_uuid();
begin
 insert into auth.users(id,email,raw_user_meta_data) values(actor,'font-qa-'||actor||'@example.invalid','{}'),(other_actor,'font-qa-'||other_actor||'@example.invalid','{}');
 insert into public.profiles(id,email) values(actor,'font-a@example.invalid'),(other_actor,'font-b@example.invalid') on conflict(id) do nothing;
 insert into public.operator_fonts(id,owner_id,name,format,storage_path,file_size,license_confirmed_at) values
 (font_a,actor,'Font A','woff2',actor::text||'/'||font_a::text||'.woff2',48,now()),
 (font_b,other_actor,'Font B','woff2',other_actor::text||'/'||font_b::text||'.woff2',48,now());
 assert not has_table_privilege('authenticated','public.operator_fonts','insert'),'Font writes restricted to verified server route';
 assert not has_table_privilege('authenticated','public.operator_fonts','delete'),'Font files cannot be removed while used by invites';
 assert not has_table_privilege('anon','public.operator_fonts','select'),'Font catalogue is not public';
 assert(select public and file_size_limit=2097152 from storage.buckets where id='invitation-custom-fonts'),'Public embedding bucket with size limit';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 set local role authenticated;
 assert(select count(*)=1 from public.operator_fonts),'Only own font catalogue is visible';
 assert(select id=font_a from public.operator_fonts),'Visible font belongs to signed-in owner';
 reset role;
end;
$$;
rollback;
select 'Font catalogue access checks passed; fixtures rolled back' as result;
