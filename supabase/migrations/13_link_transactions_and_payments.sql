-- Add payment_id column to public.transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL;

-- Create index for payment_id
CREATE INDEX IF NOT EXISTS transactions_payment_id_idx ON public.transactions(payment_id);
