-- Migration 15: Create accounts and ledger snapshots tables for ADR-0002 (Ledger Genesis v2)

-- 1. Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  bank text NOT NULL,
  currency text NOT NULL CHECK (currency IN ('ARS', 'USD')),
  type text NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'cash', 'broker')),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add account_id to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 3. Create ledger_snapshots table
CREATE TABLE IF NOT EXISTS public.ledger_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL,
  effective_date date NOT NULL,
  reason text NOT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- 4. Create ledger_snapshot_accounts table
CREATE TABLE IF NOT EXISTS public.ledger_snapshot_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid REFERENCES public.ledger_snapshots(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  opening_balance numeric(15,2) NOT NULL
);

-- RLS Policies
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_snapshot_accounts ENABLE ROW LEVEL SECURITY;

-- Allow budget owners/users full access
CREATE POLICY "Users can manage accounts of their budget" ON public.accounts
  FOR ALL USING (
    budget_id IN (
      SELECT budget_id FROM public.budget_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view ledger snapshots of their budget" ON public.ledger_snapshots
  FOR ALL USING (
    budget_id IN (
      SELECT budget_id FROM public.budget_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view snapshot accounts of their budget" ON public.ledger_snapshot_accounts
  FOR ALL USING (
    snapshot_id IN (
      SELECT id FROM public.ledger_snapshots WHERE budget_id IN (
        SELECT budget_id FROM public.budget_users WHERE user_id = auth.uid()
      )
    )
  );
