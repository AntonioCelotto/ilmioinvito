alter table public.operator_accounts add column requested_package_key text check(requested_package_key in ('pilot','five','ten','twentyfive','advice'));
create table public.operator_stripe_orders (
  id uuid primary key,
  operator_id uuid not null references public.operator_accounts(user_id) on delete cascade,
  package_key text not null check(package_key in ('pilot','five','ten','twentyfive')),
  package_name text not null,
  event_count integer not null check(event_count>0),
  net_cents integer not null check(net_cents>0),
  tax_cents integer check(tax_cents>=0),
  total_cents integer,
  stripe_session_id text unique,
  stripe_payment_id text unique,
  credit_grant_id uuid unique references public.operator_credit_grants(id),
  status text not null default 'pending' check(status in ('pending','paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check(total_cents is null or total_cents=net_cents+tax_cents)
);
create index operator_stripe_orders_operator_idx on public.operator_stripe_orders(operator_id);
alter table public.operator_stripe_orders enable row level security;
create policy operator_orders_read_own on public.operator_stripe_orders for select to authenticated using(operator_id=(select auth.uid()));
revoke all on public.operator_stripe_orders from anon,authenticated;
grant select on public.operator_stripe_orders to authenticated;
grant all on public.operator_stripe_orders to service_role;
create function public.apply_operator_stripe_checkout(
  target_order uuid,target_operator uuid,target_package text,checkout_session text,
  checkout_payment text,checkout_net integer,checkout_tax integer,checkout_total integer
) returns boolean language plpgsql security invoker set search_path='' as $$
declare
  selected_order public.operator_stripe_orders%rowtype;
  grant_id uuid;
begin
  select * into selected_order from public.operator_stripe_orders where id=target_order and operator_id=target_operator for update;
  if not found then raise exception 'OPERATOR_ORDER_NOT_FOUND'; end if;
  if selected_order.package_key is distinct from target_package
    or selected_order.net_cents is distinct from checkout_net
    or checkout_tax is null or checkout_tax<0 or checkout_total is distinct from checkout_net+checkout_tax
    or checkout_session is null or checkout_session !~ '^cs_(test_|live_)?[A-Za-z0-9]+$'
    or (selected_order.stripe_session_id is not null and selected_order.stripe_session_id<>checkout_session)
    then raise exception 'OPERATOR_PAYMENT_MISMATCH'; end if;
  if selected_order.status='paid' then return false; end if;
  -- Fulfil an already-approved paid order even if the account was subsequently
  -- suspended. Credits are preserved; suspended accounts still cannot publish.
  insert into public.operator_credit_grants(operator_id,event_count,package_name,amount_cents,note,expires_at)
    values(target_operator,selected_order.event_count,selected_order.package_name,selected_order.net_cents,'Stripe '||checkout_session,now()+interval '1 year') returning id into grant_id;
  update public.operator_stripe_orders set status='paid',tax_cents=checkout_tax,total_cents=checkout_total,
    stripe_session_id=checkout_session,stripe_payment_id=checkout_payment,credit_grant_id=grant_id,paid_at=now()
    where id=target_order;
  return true;
end;
$$;
revoke all on function public.apply_operator_stripe_checkout(uuid,uuid,text,text,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.apply_operator_stripe_checkout(uuid,uuid,text,text,text,integer,integer,integer) to service_role;
