create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stocks (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  price double precision not null default 0,
  change double precision,
  change_percent double precision,
  volume bigint,
  market_cap double precision,
  pe double precision,
  last_update timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candles (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references public.stocks (id) on delete cascade,
  bucket text not null default '1d',
  candle_at timestamptz not null,
  open double precision not null,
  high double precision not null,
  low double precision not null,
  close double precision not null,
  volume bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (stock_id, bucket, candle_at)
);

create index if not exists candles_stock_id_candle_at_idx on public.candles (stock_id, candle_at desc);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  model text not null,
  predicted_price double precision not null,
  confidence double precision not null,
  timeframe text not null,
  created_at timestamptz not null default now()
);

create index if not exists predictions_symbol_created_at_idx on public.predictions (symbol, created_at desc);

create table if not exists public.sentiments (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  score double precision not null,
  confidence double precision not null default 0.5,
  label text not null,
  signal text,
  source text not null default 'technical',
  created_at timestamptz not null default now()
);

create index if not exists sentiments_symbol_created_at_idx on public.sentiments (symbol, created_at desc);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Primary Portfolio',
  total_value double precision not null default 0,
  cash double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  quantity integer not null,
  price double precision not null,
  total double precision not null,
  fee double precision not null default 0,
  status text not null default 'EXECUTED',
  executed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists trades_user_id_symbol_executed_at_idx on public.trades (user_id, symbol, executed_at desc);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create table if not exists public.backtest_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  symbol text not null,
  strategy text not null,
  total_return double precision not null,
  max_drawdown double precision not null,
  sharpe_ratio double precision not null,
  trades integer not null default 0,
  win_rate double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists backtest_results_symbol_created_at_idx on public.backtest_results (symbol, created_at desc);

alter table public.profiles enable row level security;
alter table public.stocks enable row level security;
alter table public.candles enable row level security;
alter table public.predictions enable row level security;
alter table public.sentiments enable row level security;
alter table public.portfolios enable row level security;
alter table public.trades enable row level security;
alter table public.watchlists enable row level security;
alter table public.backtest_results enable row level security;

create policy "public market data is readable" on public.stocks for select using (true);
create policy "public candles are readable" on public.candles for select using (true);
create policy "public predictions are readable" on public.predictions for select using (true);
create policy "public sentiments are readable" on public.sentiments for select using (true);
create policy "public backtests are readable" on public.backtest_results for select using (true);

create policy "users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "users can manage own portfolios" on public.portfolios for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own watchlists" on public.watchlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own backtests" on public.backtest_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', trim(concat_ws(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name'))),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists stocks_set_updated_at on public.stocks;
create trigger stocks_set_updated_at
before update on public.stocks
for each row execute function public.set_updated_at();

drop trigger if exists portfolios_set_updated_at on public.portfolios;
create trigger portfolios_set_updated_at
before update on public.portfolios
for each row execute function public.set_updated_at();
