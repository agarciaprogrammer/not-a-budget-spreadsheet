-- Create public.payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency IN ('ARS', 'USD')),
  date date NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create public.payment_installments junction table
CREATE TABLE IF NOT EXISTS public.payment_installments (
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  installment_id uuid REFERENCES public.installments(id) ON DELETE CASCADE NOT NULL,
  amount_applied numeric(12,2) NOT NULL CHECK (amount_applied > 0),
  PRIMARY KEY (payment_id, installment_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view payments from their budgets"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budget_users 
      WHERE budget_users.budget_id = payments.budget_id 
      AND budget_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert payments to their budgets"
  ON public.payments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM budget_users 
      WHERE budget_users.budget_id = payments.budget_id 
      AND budget_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own payments"
  ON public.payments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own payments"
  ON public.payments FOR DELETE
  USING (user_id = auth.uid());

-- Payment installments policies
CREATE POLICY "Users can view payment_installments details"
  ON public.payment_installments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_installments.payment_id
      AND EXISTS (
        SELECT 1 FROM budget_users
        WHERE budget_users.budget_id = payments.budget_id
        AND budget_users.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert payment_installments details"
  ON public.payment_installments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_installments.payment_id
      AND payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own payment_installments"
  ON public.payment_installments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_installments.payment_id
      AND payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own payment_installments"
  ON public.payment_installments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_installments.payment_id
      AND payments.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS payments_budget_id_idx ON payments(budget_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_date_idx ON payments(date);
CREATE INDEX IF NOT EXISTS payment_installments_installment_id_idx ON payment_installments(installment_id);
