-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (Automated by Supabase Auth, but we can store extra profile info if needed)
-- We will just use the auth.users table for foreign keys.

-- TRANSACTIONS TABLE
create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null check (type in ('income', 'expense')),
    name text not null,
    amount numeric not null,
    category text not null,
    date date not null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DEBTS TABLE
create table if not exists public.debts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null check (type in ('loan', 'credit card')),
    name text not null,
    balance numeric not null,
    rate numeric not null,
    min_payment numeric not null,
    due_date date,
    paid numeric not null default 0,
    total_interest_paid numeric not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- VACATIONS TABLE
create table if not exists public.vacations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    goal numeric not null,
    saved numeric not null default 0,
    target_date date,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUBSCRIPTIONS TABLE
create table if not exists public.subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    amount numeric not null,
    category text not null,
    frequency text not null check (frequency in ('Weekly', 'Monthly', 'Yearly')),
    next_date date not null,
    is_active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS)
-- Ensure users can only see and modify their own data

alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.vacations enable row level security;
alter table public.subscriptions enable row level security;

-- Policies for Transactions
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Policies for Debts
create policy "Users can view own debts" on public.debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts" on public.debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts" on public.debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts" on public.debts for delete using (auth.uid() = user_id);

-- Policies for Vacations
create policy "Users can view own vacations" on public.vacations for select using (auth.uid() = user_id);
create policy "Users can insert own vacations" on public.vacations for insert with check (auth.uid() = user_id);
create policy "Users can update own vacations" on public.vacations for update using (auth.uid() = user_id);
create policy "Users can delete own vacations" on public.vacations for delete using (auth.uid() = user_id);

-- Policies for Subscriptions
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own subscriptions" on public.subscriptions for update using (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on public.subscriptions for delete using (auth.uid() = user_id);
