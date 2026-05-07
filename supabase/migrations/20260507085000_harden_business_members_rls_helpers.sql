create schema if not exists private;

create or replace function private.is_business_member(target_business_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = target_user_id
  );
$$;

create or replace function private.has_business_role(target_business_id uuid, target_user_id uuid, allowed_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = target_user_id
      and bm.role = any(allowed_roles)
  );
$$;

revoke all on schema private from public, anon, authenticated;
revoke all on function private.is_business_member(uuid, uuid) from public, anon, authenticated;
revoke all on function private.has_business_role(uuid, uuid, public.member_role[]) from public, anon, authenticated;

drop policy if exists "businesses_select_member_or_creator" on public.businesses;
drop policy if exists "businesses_update_owner" on public.businesses;
drop policy if exists "business_members_select_same_business" on public.business_members;
drop policy if exists "customers_member_access" on public.customers;
drop policy if exists "services_member_access" on public.services;
drop policy if exists "orders_member_access" on public.orders;
drop policy if exists "order_items_member_access" on public.order_items;
drop policy if exists "payments_member_access" on public.payments;
drop policy if exists "inventory_items_member_access" on public.inventory_items;
drop policy if exists "expenses_member_access" on public.expenses;

create policy "businesses_select_member_or_creator" on public.businesses for select to authenticated using (
  created_by = (select auth.uid()) or private.is_business_member(id, (select auth.uid()))
);

create policy "businesses_update_owner" on public.businesses for update to authenticated using (
  private.has_business_role(id, (select auth.uid()), array['owner','manager']::public.member_role[])
) with check (
  private.has_business_role(id, (select auth.uid()), array['owner','manager']::public.member_role[])
);

create policy "business_members_select_same_business" on public.business_members for select to authenticated using (
  user_id = (select auth.uid()) or private.is_business_member(business_id, (select auth.uid()))
);

create policy "customers_member_access" on public.customers for all to authenticated using (private.is_business_member(business_id, (select auth.uid()))) with check (private.is_business_member(business_id, (select auth.uid())));
create policy "services_member_access" on public.services for all to authenticated using (private.is_business_member(business_id, (select auth.uid()))) with check (private.is_business_member(business_id, (select auth.uid())));
create policy "orders_member_access" on public.orders for all to authenticated using (private.is_business_member(business_id, (select auth.uid()))) with check (private.is_business_member(business_id, (select auth.uid())));
create policy "order_items_member_access" on public.order_items for all to authenticated using (private.is_business_member(business_id, (select auth.uid()))) with check (private.is_business_member(business_id, (select auth.uid())));
create policy "payments_member_access" on public.payments for all to authenticated using (private.is_business_member(business_id, (select auth.uid()))) with check (private.is_business_member(business_id, (select auth.uid())));
create policy "inventory_items_member_access" on public.inventory_items for all to authenticated using (private.is_business_member(business_id, (select auth.uid()))) with check (private.is_business_member(business_id, (select auth.uid())));
create policy "expenses_member_access" on public.expenses for all to authenticated using (private.is_business_member(business_id, (select auth.uid()))) with check (private.is_business_member(business_id, (select auth.uid())));
