-- CambioKPI Initial Schema
-- Migration 001: Core tables and RLS policies

-- ============================================================
-- OPERATORS
-- ============================================================
create table operators (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  business_name text,
  telegram_handle text,
  created_at timestamptz default now()
);

alter table operators enable row level security;

create policy "Operators can read own profile"
  on operators for select
  using (auth.uid() = id);

create policy "Operators can update own profile"
  on operators for update
  using (auth.uid() = id);

create policy "Allow operator registration insert"
  on operators for insert
  with check (auth.uid() = id);

-- ============================================================
-- MARGIN SETTINGS
-- ============================================================
create table margin_settings (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  pair text not null check (pair in ('EUR_USDT', 'USD_USDT', 'VES_USDT')),
  margin_percent numeric(5,2) not null default 2.0,
  min_margin_percent numeric(5,2) not null default 1.0,
  updated_at timestamptz default now(),
  unique(operator_id, pair)
);

alter table margin_settings enable row level security;

create policy "Operators can read own margin settings"
  on margin_settings for select
  using (auth.uid() = operator_id);

create policy "Operators can insert own margin settings"
  on margin_settings for insert
  with check (auth.uid() = operator_id);

create policy "Operators can update own margin settings"
  on margin_settings for update
  using (auth.uid() = operator_id);

-- ============================================================
-- CLIENT REQUESTS (must come before transactions for FK)
-- ============================================================
create table client_requests (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  client_name text,
  client_contact text,
  amount_in numeric(18,4) not null,
  currency_in text not null,
  currency_out text not null default 'USDT',
  payment_method text not null,
  wallet_address text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  notes text,
  created_at timestamptz default now()
);

create index idx_client_requests_operator_status on client_requests(operator_id, status);

alter table client_requests enable row level security;

-- Anyone (anon) can insert a client request
create policy "Anyone can create client requests"
  on client_requests for insert
  to anon
  with check (true);

-- Service role can read all (for API route)
create policy "Service role can read all client requests"
  on client_requests for select
  to service_role
  using (true);

-- Operators can read requests addressed to them
create policy "Operators can read own client requests"
  on client_requests for select
  using (auth.uid() = operator_id);

-- Operators can update requests addressed to them
create policy "Operators can update own client requests"
  on client_requests for update
  using (auth.uid() = operator_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  pair text not null,
  direction text not null check (direction in ('BUY', 'SELL')),
  amount_in numeric(18,4) not null,
  currency_in text not null,
  amount_out numeric(18,4) not null,
  currency_out text not null,
  rate_used numeric(18,6) not null,
  margin_percent numeric(5,2) not null,
  profit_usdt numeric(18,4) not null,
  payment_method text,
  client_name text,
  notes text,
  status text default 'completed' check (status in ('completed', 'pending', 'cancelled')),
  source text default 'manual' check (source in ('manual', 'client_request')),
  client_request_id uuid references client_requests(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_transactions_operator_date on transactions(operator_id, created_at desc);

alter table transactions enable row level security;

create policy "Operators can read own transactions"
  on transactions for select
  using (auth.uid() = operator_id);

create policy "Operators can insert own transactions"
  on transactions for insert
  with check (auth.uid() = operator_id);

create policy "Operators can update own transactions"
  on transactions for update
  using (auth.uid() = operator_id);

-- ============================================================
-- MONTHLY GOALS
-- ============================================================
create table monthly_goals (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  target_profit_usdt numeric(18,4) not null,
  created_at timestamptz default now(),
  unique(operator_id, year, month)
);

alter table monthly_goals enable row level security;

create policy "Operators can read own goals"
  on monthly_goals for select
  using (auth.uid() = operator_id);

create policy "Operators can insert own goals"
  on monthly_goals for insert
  with check (auth.uid() = operator_id);

create policy "Operators can update own goals"
  on monthly_goals for update
  using (auth.uid() = operator_id);

-- ============================================================
-- TRIGGER: Auto-create operator profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.operators (id, full_name, business_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Operator'),
    coalesce(new.raw_user_meta_data ->> 'business_name', 'Cambista')
  );

  insert into public.margin_settings (operator_id, pair, margin_percent, min_margin_percent)
  values
    (new.id, 'USD_USDT', 1.5, 0.5),
    (new.id, 'EUR_USDT', 2.0, 1.0),
    (new.id, 'VES_USDT', 5.0, 3.0);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PUBLIC OPERATOR INFO (safe for unauthenticated access)
-- ============================================================
create or replace function public.get_operator_info(operator_id uuid)
returns table(
  business_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select business_name, created_at
  from public.operators
  where id = operator_id;
$$;
