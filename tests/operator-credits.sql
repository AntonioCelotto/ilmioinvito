-- Integration tests run inside a transaction; all fixtures are rolled back.
begin;
do $$
declare
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  event_a uuid := gen_random_uuid();
  event_b uuid := gen_random_uuid();
  event_foreign uuid := gen_random_uuid();
  grant_a uuid := gen_random_uuid();
  response jsonb;
  blocked boolean;
begin
  insert into auth.users(id,email,raw_user_meta_data) values(user_a,'operator-sql-a-'||user_a||'@example.invalid','{}'),(user_b,'operator-sql-b-'||user_b||'@example.invalid','{}');
  insert into public.profiles(id,email) values(user_a,'test-a@example.invalid'),(user_b,'test-b@example.invalid') on conflict(id) do nothing;
  insert into public.operator_accounts(user_id,full_name,company_name,email,phone,vat_number,billing_address,terms_version)
  values(user_a,'Test A','Test','test-a@example.invalid','0','test','test','test'),(user_b,'Test B','Test','test-b@example.invalid','0','test','test','test');
  insert into public.invitations(id,owner_id,slug,title) values(event_a,user_a,'test-'||event_a,'Evento A'),(event_b,user_a,'test-'||event_b,'Evento B'),(event_foreign,user_b,'test-'||event_foreign,'Evento altro operatore');
  blocked := false;
  begin perform public.publish_operator_invitation(user_a,event_a); exception when others then if sqlerrm='OPERATOR_NOT_ACTIVE' then blocked:=true; else raise; end if; end;
  assert blocked,'Pending operator must not publish';
  update public.operator_accounts set status='active' where user_id=user_a;
  blocked := false;
  begin perform public.publish_operator_invitation(user_a,event_foreign); exception when others then if sqlerrm='INVITATION_NOT_OWNED' then blocked:=true; else raise; end if; end;
  assert blocked,'Foreign event must not publish';
  -- Expired grant must not be spent.
  insert into public.operator_credit_grants(operator_id,event_count,package_name,amount_cents,created_at,expires_at)
    values(user_a,5,'Expired test',0,now()-interval '2 years',now()-interval '1 year');
  blocked := false;
  begin perform public.publish_operator_invitation(user_a,event_a); exception when others then if sqlerrm='NO_OPERATOR_CREDITS' then blocked:=true; else raise; end if; end;
  assert blocked,'Expired credits must not publish';
  insert into public.operator_credit_grants(id,operator_id,event_count,package_name,amount_cents,expires_at) values(grant_a,user_a,1,'Test',0,now()+interval '1 year');
  response := public.publish_operator_invitation(user_a,event_a);
  assert response->>'consumed'='true','First publication consumes a credit';
  assert (select used_count=1 from public.operator_credit_grants where id=grant_a),'Exactly one credit spent';
  assert (select status='published' from public.invitations where id=event_a),'Invitation published';
  assert (select base_guest_limit is null and status='active' from public.invitation_entitlements where invitation_id=event_a),'Unlimited active licence';
  response := public.publish_operator_invitation(user_a,event_a);
  assert response->>'consumed'='false','Repeat publication does not consume';
  assert (select used_count=1 from public.operator_credit_grants where id=grant_a),'Repeat does not debit';
  blocked := false;
  begin perform public.publish_operator_invitation(user_a,event_b); exception when others then if sqlerrm='NO_OPERATOR_CREDITS' then blocked:=true; else raise; end if; end;
  assert blocked,'Exhausted credits must block next event';
  assert not exists(select 1 from public.invitation_entitlements where invitation_id=event_b),'Failed publication cannot activate entitlement';
  assert not exists(select 1 from public.operator_event_activations where invitation_id=event_b),'Failed publication cannot record usage';
  update public.operator_accounts set status='suspended' where user_id=user_a;
  blocked := false;
  begin perform public.publish_operator_invitation(user_a,event_a); exception when others then if sqlerrm='OPERATOR_NOT_ACTIVE' then blocked:=true; else raise; end if; end;
  assert blocked,'Suspended operator cannot invoke new publications';
  blocked := false;
  begin update public.invitations set status='published' where id=event_b; exception when others then blocked:=true; end;
  assert blocked,'Direct publication bypass must be blocked';
  assert not has_function_privilege('authenticated','public.publish_operator_invitation(uuid,uuid)','execute'),'RPC must be service-only';
  assert not has_table_privilege('authenticated','public.operator_credit_grants','insert'),'Users cannot grant credits';
  assert not has_table_privilege('authenticated','public.operator_accounts','update'),'Users cannot approve themselves';
  -- An authenticated operator sees only their own records through RLS.
  perform set_config('request.jwt.claims',jsonb_build_object('sub',user_b,'role','authenticated')::text,true);
  set local role authenticated;
  assert (select count(*)=1 from public.operator_accounts),'Account RLS isolates operators';
  assert (select count(*)=0 from public.operator_credit_grants),'Grant RLS isolates operators';
  assert (select count(*)=0 from public.operator_event_activations),'Usage RLS isolates operators';
  reset role;
end;
$$;
rollback;
select 'Operator credit checks passed; fixtures rolled back' as result;
