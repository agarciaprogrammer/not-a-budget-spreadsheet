-- Create public.commitments table
CREATE TABLE IF NOT EXISTS public.commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency IN ('ARS', 'USD')),
  date date NOT NULL,
  due_date date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('debit', 'credit', 'cash', 'transfer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- Commitments policies
CREATE POLICY "Users can view commitments from their budgets"
  ON commitments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budget_users 
      WHERE budget_users.budget_id = commitments.budget_id 
      AND budget_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert commitments to their budgets"
  ON commitments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM budget_users 
      WHERE budget_users.budget_id = commitments.budget_id 
      AND budget_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own commitments"
  ON commitments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own commitments"
  ON commitments FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS commitments_budget_id_idx ON commitments(budget_id);
CREATE INDEX IF NOT EXISTS commitments_user_id_idx ON commitments(user_id);
CREATE INDEX IF NOT EXISTS commitments_due_date_idx ON commitments(due_date);
CREATE INDEX IF NOT EXISTS commitments_status_idx ON commitments(status);
