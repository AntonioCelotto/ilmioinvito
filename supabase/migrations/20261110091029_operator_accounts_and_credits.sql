-- Operator access is approved server-side; signup metadata never grants privileges.
create table public.operator_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null,
  company_name text not null,
  email text not null,
  phone text not null,
  vat_number text not null,
  billing_address text not null,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  terms_version text not null,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz
);
create table public.operator_credit_grants (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operator_accounts(user_id) on delete cascade,
  event_count integer not null check(event_count > 0),
  used_count integer not null default 0 check(used_count >= 0 and used_count <= event_count),
  package_name text not null,
  amount_cents integer not null check(amount_cents >= 0),
  note text not null default '',
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null check(expires_at > created_at)
);
-- Preserve activation history even when the operator deletes an invitation.
create table public.operator_event_activations (
  invitation_id uuid primary key,
  operator_id uuid not null references public.operator_accounts(user_id) on delete cascade,
  grant_id uuid not null references public.operator_credit_grants(id),
  invitation_title text not null,
  created_at timestamptz not null default now()
);
create index operator_credit_grants_operator_expiry_idx on public.operator_credit_grants(operator_id,expires_at);
create index operator_event_activations_operator_idx on public.operator_event_activations(operator_id);
create index operator_event_activations_grant_idx on public.operator_event_activations(grant_id);
create index operator_accounts_reviewed_by_idx on public.operator_accounts(reviewed_by);
create index operator_credit_grants_granted_by_idx on public.operator_credit_grants(granted_by);
alter table public.operator_accounts enable row level security;
alter table public.operator_credit_grants enable row level security;
alter table public.operator_event_activations enable row level security;
create policy operator_accounts_read_own on public.operator_accounts for select to authenticated using (user_id = (select auth.uid()));
create policy operator_grants_read_own on public.operator_credit_grants for select to authenticated using (operator_id = (select auth.uid()));
create policy operator_activations_read_own on public.operator_event_activations for select to authenticated using (operator_id = (select auth.uid()));
revoke all on public.operator_accounts,public.operator_credit_grants,public.operator_event_activations from anon,authenticated;
grant select on public.operator_accounts,public.operator_credit_grants,public.operator_event_activations to authenticated;
grant all on public.operator_accounts,public.operator_credit_grants,public.operator_event_activations to service_role;

-- This transaction is callable ONLY by the backend after getUser(token).
-- Locking the operator serializes concurrent publication requests across events.
create function public.publish_operator_invitation(target_operator uuid,target_invitation uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  operator_status text;
  selected_invitation public.invitations%rowtype;
  selected_grant uuid;
begin
  select status into operator_status from public.operator_accounts where user_id=target_operator for update;
  if operator_status is distinct from 'active' then raise exception 'OPERATOR_NOT_ACTIVE'; end if;
  select * into selected_invitation from public.invitations where id=target_invitation and owner_id=target_operator for update;
  if not found then raise exception 'INVITATION_NOT_OWNED'; end if;
  if exists(select 1 from public.invitation_entitlements where invitation_id=target_invitation and owner_id=target_operator and status='active') then
    update public.invitations set status='published',published_at=coalesce(published_at,now()),updated_at=now() where id=target_invitation;
    return jsonb_build_object('consumed',false);
  end if;
  if exists(select 1 from public.operator_event_activations where invitation_id=target_invitation) then
    -- Do not revive a refunded/revoked entitlement through a repeated request.
    raise exception 'ACTIVATION_INACTIVE';
  end if;
  select id into selected_grant from public.operator_credit_grants
    where operator_id=target_operator and expires_at>now() and used_count<event_count
    order by expires_at,created_at,id limit 1 for update;
  if selected_grant is null then raise exception 'NO_OPERATOR_CREDITS'; end if;
  update public.operator_credit_grants set used_count=used_count+1 where id=selected_grant;
  insert into public.operator_event_activations(invitation_id,operator_id,grant_id,invitation_title)
    values(target_invitation,target_operator,selected_grant,selected_invitation.title);
  -- The existing premium entitlement already enables all features, custom art
  -- and unlimited guests. Operator activation records identify the Firma licence
  -- without changing historical consumer plans or the Stripe product mapping.
  insert into public.invitation_entitlements(invitation_id,owner_id,plan_key,base_guest_limit,extra_guest_limit,status)
    values(target_invitation,target_operator,'premium',null,0,'active')
    on conflict(invitation_id) do update set plan_key='premium',base_guest_limit=null,extra_guest_limit=0,status='active',updated_at=now();
  update public.invitations set status='published',published_at=coalesce(published_at,now()),updated_at=now() where id=target_invitation;
  return jsonb_build_object('consumed',true);
end;
$$;
revoke all on function public.publish_operator_invitation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_operator_invitation(uuid,uuid) to service_role;

-- Enforce paid/credited activation even if a client calls the Data API directly.
-- Ordinary saves of already-published invitations remain unchanged.
create function public.require_invitation_activation()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
    if not exists(select 1 from public.invitation_entitlements where invitation_id=new.id and owner_id=new.owner_id and status='active') then
      raise exception 'Attiva un pacchetto o utilizza un credito operatore prima di pubblicare.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.require_invitation_activation() from public,anon,authenticated;
create trigger require_invitation_activation before insert or update of status on public.invitations
  for each row execute function public.require_invitation_activation();
