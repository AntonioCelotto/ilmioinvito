create table if not exists public.invitation_entitlements (
  invitation_id uuid primary key references public.invitations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan_key text not null check (plan_key in ('essential', 'complete', 'premium')),
  base_guest_limit integer check (base_guest_limit is null or base_guest_limit >= 0),
  extra_guest_limit integer not null default 0 check (extra_guest_limit >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'refunded')),
  last_checkout_session_id text,
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitation_entitlements_owner_id_idx
  on public.invitation_entitlements(owner_id);

alter table public.invitation_entitlements enable row level security;

create policy "invitation_entitlements_select_own"
on public.invitation_entitlements for select
to authenticated
using ((select auth.uid()) = owner_id);

revoke all on table public.invitation_entitlements from anon;
grant select on table public.invitation_entitlements to authenticated;
grant all on table public.invitation_entitlements to service_role;

drop function if exists public.apply_stripe_checkout(uuid, text, text, text, integer, text);

create function public.apply_stripe_checkout(
  checkout_owner_id uuid,
  checkout_invitation_id uuid,
  checkout_session_id text,
  checkout_payment_id text,
  checkout_product_key text,
  checkout_amount_cents integer,
  checkout_currency text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  selected_limit integer;
begin
  if checkout_product_key not in ('essential', 'complete', 'premium', 'guest_pack_50') then
    raise exception 'Unsupported billing product';
  end if;

  if not exists (
    select 1 from public.invitations
    where id = checkout_invitation_id and owner_id = checkout_owner_id
  ) then
    raise exception 'Invitation not found or not owned by customer';
  end if;

  if exists (select 1 from public.payments where provider_checkout_id = checkout_session_id) then
    return false;
  end if;

  insert into public.payments (
    invitation_id, owner_id, provider, provider_checkout_id,
    provider_payment_id, amount_cents, currency, status,
    product_key, guest_increment, paid_at
  ) values (
    checkout_invitation_id, checkout_owner_id, 'stripe', checkout_session_id,
    checkout_payment_id, checkout_amount_cents, lower(checkout_currency), 'paid',
    checkout_product_key,
    case when checkout_product_key = 'guest_pack_50' then 50 else 0 end,
    now()
  );

  if checkout_product_key = 'guest_pack_50' then
    update public.invitation_entitlements
    set extra_guest_limit = extra_guest_limit + 50,
        last_checkout_session_id = checkout_session_id,
        updated_at = now()
    where invitation_id = checkout_invitation_id
      and owner_id = checkout_owner_id
      and status = 'active'
      and plan_key <> 'premium';

    if not found then raise exception 'No eligible plan for guest extension'; end if;
  else
    selected_limit := case checkout_product_key
      when 'essential' then 30
      when 'complete' then 100
      when 'premium' then null
    end;

    insert into public.invitation_entitlements (
      invitation_id, owner_id, plan_key, base_guest_limit, status,
      last_checkout_session_id, activated_at, updated_at
    ) values (
      checkout_invitation_id, checkout_owner_id, checkout_product_key,
      selected_limit, 'active', checkout_session_id, now(), now()
    )
    on conflict (invitation_id) do update
    set plan_key = excluded.plan_key,
        base_guest_limit = excluded.base_guest_limit,
        status = 'active',
        last_checkout_session_id = excluded.last_checkout_session_id,
        activated_at = now(),
        updated_at = now();

    update public.invitations
    set status = 'published', published_at = coalesce(published_at, now()), updated_at = now()
    where id = checkout_invitation_id and owner_id = checkout_owner_id;
  end if;

  return true;
end;
$$;

revoke all on function public.apply_stripe_checkout(uuid, uuid, text, text, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.apply_stripe_checkout(uuid, uuid, text, text, text, integer, text)
  to service_role;
