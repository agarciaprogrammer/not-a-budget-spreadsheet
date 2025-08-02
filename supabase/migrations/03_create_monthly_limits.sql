-- Create monthly_limits table for month-specific spending limits
CREATE TABLE public.monthly_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount_limit NUMERIC(12,2) NOT NULL CHECK (amount_limit > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(budget_id, year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_limits ENABLE ROW LEVEL SECURITY;

-- Monthly limits policies
CREATE POLICY "Users can view their own monthly limits"
  ON monthly_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets 
      WHERE budgets.id = monthly_limits.budget_id 
      AND budgets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own monthly limits"
  ON monthly_limits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets 
      WHERE budgets.id = monthly_limits.budget_id 
      AND budgets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own monthly limits"
  ON monthly_limits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM budgets 
      WHERE budgets.id = monthly_limits.budget_id 
      AND budgets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own monthly limits"
  ON monthly_limits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budgets 
      WHERE budgets.id = monthly_limits.budget_id 
      AND budgets.owner_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX monthly_limits_budget_id_idx ON monthly_limits(budget_id);
CREATE INDEX monthly_limits_year_month_idx ON monthly_limits(year, month); 