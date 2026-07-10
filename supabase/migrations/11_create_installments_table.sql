-- Create public.installments table
CREATE TABLE IF NOT EXISTS public.installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid REFERENCES public.commitments(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  installment_number integer NOT NULL CHECK (installment_number > 0),
  total_installments integer NOT NULL CHECK (total_installments >= installment_number),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- Installments policies
CREATE POLICY "Users can view installments from their budgets"
  ON installments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = installments.commitment_id
      AND EXISTS (
        SELECT 1 FROM budget_users
        WHERE budget_users.budget_id = commitments.budget_id
        AND budget_users.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert installments to their commitments"
  ON installments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = installments.commitment_id
      AND commitments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own installments"
  ON public.installments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = installments.commitment_id
      AND commitments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own installments"
  ON public.installments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = installments.commitment_id
      AND commitments.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS installments_commitment_id_idx ON installments(commitment_id);
CREATE INDEX IF NOT EXISTS installments_due_date_idx ON installments(due_date);
CREATE INDEX IF NOT EXISTS installments_status_idx ON installments(status);
