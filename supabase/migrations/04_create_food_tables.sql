-- Create food (ingredients) table
create table public.food (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete cascade not null,

  name text not null,
  category text not null,

  units integer not null check (units > 0),
  unit_weight numeric(10,2) not null check (unit_weight > 0),
  weight_unit text check (weight_unit in ('g', 'kg')) not null,

  storage text check (storage in ('fridge', 'freezer', 'pantry')) not null,
  status text check (status in ('ok', 'low', 'restock')) not null default 'ok',

  created_at timestamp with time zone
    default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.food enable row level security;

-- Policies
create policy "Users can view their own food items"
  on public.food
  for select
  using (user_id = auth.uid());

create policy "Users can insert their own food items"
  on public.food
  for insert
  with check (user_id = auth.uid());

create policy "Users can update their own food items"
  on public.food
  for update
  using (user_id = auth.uid());

create policy "Users can delete their own food items"
  on public.food
  for delete
  using (user_id = auth.uid());

create index food_user_id_idx on public.food(user_id);
create index food_status_idx on public.food(status);
create index food_category_idx on public.food(category);
