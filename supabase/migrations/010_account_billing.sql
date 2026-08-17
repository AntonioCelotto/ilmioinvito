alter table public.payments
  alter column invitation_id drop not null,
  add column if not exists product_key text,
  add column if not exists guest_increment integer not null default 0;

create unique index if not exists payments_provider_checkout_id_uidx
  on public.payments(provider_checkout_id)
  where provider_checkout_id is not null;

create table public.account_entitlements (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  plan_key text not null check (plan_key in ('essential', 'complete', 'premium')),
  base_guest_limit integer check (base_guest_limit is null or base_guest_limit >= 0),
  extra_guest_limit integer not null default 0 check (extra_guest_limit >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'refunded')),
  stripe_customer_id text,
  last_checkout_session_id text,
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index account_entitlements_status_idx on public.account_entitlements(status);

alter table public.account_entitlements enable row level security;

create policy "account_entitlements_select_own"
on public.account_entitlements for select
to authenticated
using ((select auth.uid()) = owner_id);

revoke all on table public.account_entitlements from anon;
grant select on table public.account_entitlements to authenticated;
grant all on table public.account_entitlements to service_role;

create or replace function public.apply_stripe_checkout(
  checkout_owner_id uuid,
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

  if exists (
    select 1 from public.payments
    where provider_checkout_id = checkout_session_id
  ) then
    return false;
  end if;

  insert into public.payments (
    invitation_id, owner_id, provider, provider_checkout_id,
    provider_payment_id, amount_cents, currency, status,
    product_key, guest_increment, paid_at
  ) values (
    null, checkout_owner_id, 'stripe', checkout_session_id,
    checkout_payment_id, checkout_amount_cents, lower(checkout_currency), 'paid',
    checkout_product_key,
    case when checkout_product_key = 'guest_pack_50' then 50 else 0 end,
    now()
  );

  if checkout_product_key = 'guest_pack_50' then
    update public.account_entitlements
    set extra_guest_limit = extra_guest_limit + 50,
        last_checkout_session_id = checkout_session_id,
        updated_at = now()
    where owner_id = checkout_owner_id
      and status = 'active'
      and plan_key <> 'premium';

    if not found then
      raise exception 'No eligible plan for guest extension';
    end if;
  else
    selected_limit := case checkout_product_key
      when 'essential' then 30
      when 'complete' then 100
      when 'premium' then null
    end;

    insert into public.account_entitlements (
      owner_id, plan_key, base_guest_limit, status,
      last_checkout_session_id, activated_at, updated_at
    ) values (
      checkout_owner_id, checkout_product_key, selected_limit, 'active',
      checkout_session_id, now(), now()
    )
    on conflict (owner_id) do update
    set plan_key = excluded.plan_key,
        base_guest_limit = excluded.base_guest_limit,
        status = 'active',
        last_checkout_session_id = excluded.last_checkout_session_id,
        activated_at = now(),
        updated_at = now();
  end if;

  return true;
end;
$$;

revoke all on function public.apply_stripe_checkout(uuid, text, text, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.apply_stripe_checkout(uuid, text, text, text, integer, text)
  to service_role;
