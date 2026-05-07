create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'manager', 'staff', 'delivery');
create type public.customer_type as enum ('Regular', 'VIP', 'Corporate', 'Hotel', 'Walk-in');
create type public.order_status as enum ('Received', 'Sorting', 'Washing', 'Drying', 'Ironing', 'Packaging', 'Ready', 'Delivered', 'Collected', 'Cancelled');
create type public.payment_method as enum ('Cash', 'Mobile Money', 'Bank Transfer', 'Card');
create type public.pricing_type as enum ('item', 'weight', 'package');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'GHS',
  phone text,
  address text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  type public.customer_type not null default 'Regular',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  pricing_type public.pricing_type not null default 'item',
  default_price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  service_name text not null,
  status public.order_status not null default 'Received',
  pickup_delivery text not null default 'pickup',
  due_label text,
  due_at timestamptz,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  staff_owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_number),
  constraint non_negative_order_amounts check (subtotal >= 0 and discount >= 0 and total_amount >= 0 and amount_paid >= 0)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  receipt_number text not null,
  amount numeric(12,2) not null check (amount >= 0),
  method public.payment_method not null default 'Cash',
  received_by uuid references auth.users(id) on delete set null,
  notes text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (business_id, receipt_number)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  quantity_available numeric(12,2) not null default 0 check (quantity_available >= 0),
  reorder_level numeric(12,2) not null default 0 check (reorder_level >= 0),
  unit text not null default 'pcs',
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  supplier text,
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  recorded_by uuid references auth.users(id) on delete set null,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index business_members_user_id_idx on public.business_members(user_id);
create index customers_business_id_idx on public.customers(business_id);
create index services_business_id_idx on public.services(business_id);
create index orders_business_id_status_idx on public.orders(business_id, status);
create index payments_business_id_paid_at_idx on public.payments(business_id, paid_at desc);
create index inventory_items_business_id_idx on public.inventory_items(business_id);
create index expenses_business_id_date_idx on public.expenses(business_id, expense_date desc);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_items enable row level security;
alter table public.expenses enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "businesses_select_member_or_creator" on public.businesses for select to authenticated using (
  created_by = (select auth.uid()) or exists (
    select 1 from public.business_members bm where bm.business_id = businesses.id and bm.user_id = (select auth.uid())
  )
);
create policy "businesses_insert_creator" on public.businesses for insert to authenticated with check (created_by = (select auth.uid()));
create policy "businesses_update_owner" on public.businesses for update to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = businesses.id and bm.user_id = (select auth.uid()) and bm.role in ('owner','manager'))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = businesses.id and bm.user_id = (select auth.uid()) and bm.role in ('owner','manager'))
);

create policy "business_members_select_same_business" on public.business_members for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.business_members bm where bm.business_id = business_members.business_id and bm.user_id = (select auth.uid())
  )
);
create policy "business_members_insert_owner_for_created_business" on public.business_members for insert to authenticated with check (
  user_id = (select auth.uid()) and role = 'owner' and exists (
    select 1 from public.businesses b where b.id = business_members.business_id and b.created_by = (select auth.uid())
  )
);

create policy "customers_member_access" on public.customers for all to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = customers.business_id and bm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = customers.business_id and bm.user_id = (select auth.uid()))
);

create policy "services_member_access" on public.services for all to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = services.business_id and bm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = services.business_id and bm.user_id = (select auth.uid()))
);

create policy "orders_member_access" on public.orders for all to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = orders.business_id and bm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = orders.business_id and bm.user_id = (select auth.uid()))
);

create policy "order_items_member_access" on public.order_items for all to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = order_items.business_id and bm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = order_items.business_id and bm.user_id = (select auth.uid()))
);

create policy "payments_member_access" on public.payments for all to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = payments.business_id and bm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = payments.business_id and bm.user_id = (select auth.uid()))
);

create policy "inventory_items_member_access" on public.inventory_items for all to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = inventory_items.business_id and bm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = inventory_items.business_id and bm.user_id = (select auth.uid()))
);

create policy "expenses_member_access" on public.expenses for all to authenticated using (
  exists (select 1 from public.business_members bm where bm.business_id = expenses.business_id and bm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.business_members bm where bm.business_id = expenses.business_id and bm.user_id = (select auth.uid()))
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
