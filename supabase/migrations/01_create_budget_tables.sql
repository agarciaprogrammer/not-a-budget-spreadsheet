-- Create budgets table
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create budget_users table for access control
create table public.budget_users (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.budgets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'collaborator')) not null default 'owner',
  unique(budget_id, user_id)
);

-- Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.budgets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  type text check (type in ('income', 'expense')) not null,
  amount numeric(10,2) not null check (amount > 0),
  date timestamp with time zone not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.budgets enable row level security;
alter table public.budget_users enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Budgets policies
create policy "Users can view their own budgets"
  on budgets for select
  using (owner_id = auth.uid());

create policy "Users can insert their own budgets"
  on budgets for insert
  with check (owner_id = auth.uid());

create policy "Users can update their own budgets"
  on budgets for update
  using (owner_id = auth.uid());

create policy "Users can delete their own budgets"
  on budgets for delete
  using (owner_id = auth.uid());

-- Budget users policies
create policy "Users can view budget access"
  on budget_users for select
  using (user_id = auth.uid());

create policy "Budget owners can manage access"
  on budget_users for all
  using (
    exists (
      select 1 from budgets 
      where budgets.id = budget_users.budget_id 
      and budgets.owner_id = auth.uid()
    )
  );

-- Categories policies
create policy "Users can view their own categories"
  on categories for select
  using (user_id = auth.uid());

create policy "Users can insert their own categories"
  on categories for insert
  with check (user_id = auth.uid());

create policy "Users can update their own categories"
  on categories for update
  using (user_id = auth.uid());

create policy "Users can delete their own categories"
  on categories for delete
  using (user_id = auth.uid());

-- Transactions policies
create policy "Users can view transactions from their budgets"
  on transactions for select
  using (
    exists (
      select 1 from budget_users 
      where budget_users.budget_id = transactions.budget_id 
      and budget_users.user_id = auth.uid()
    )
  );

create policy "Users can insert transactions to their budgets"
  on transactions for insert
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from budget_users 
      where budget_users.budget_id = transactions.budget_id 
      and budget_users.user_id = auth.uid()
    )
  );

create policy "Users can update their own transactions"
  on transactions for update
  using (user_id = auth.uid());

create policy "Users can delete their own transactions"
  on transactions for delete
  using (user_id = auth.uid());

-- Create indexes for performance
create index budgets_owner_id_idx on budgets(owner_id);
create index budget_users_budget_id_idx on budget_users(budget_id);
create index budget_users_user_id_idx on budget_users(user_id);
create index categories_user_id_idx on categories(user_id);
create index transactions_budget_id_idx on transactions(budget_id);
create index transactions_user_id_idx on transactions(user_id);
create index transactions_date_idx on transactions(date); 