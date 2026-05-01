ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_amount_check;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_expense_kind_required;

ALTER TABLE public.transactions
  ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE public.transactions
  ALTER COLUMN amount DROP NOT NULL;

ALTER TABLE public.transactions
  ALTER COLUMN amount TYPE NUMERIC(12,2);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS from_currency TEXT,
  ADD COLUMN IF NOT EXISTS from_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS to_currency TEXT,
  ADD COLUMN IF NOT EXISTS to_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense', 'transfer', 'adjustment'));

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_currency_values_check
  CHECK (
    (currency IS NULL OR currency IN ('ARS', 'USD'))
    AND (from_currency IS NULL OR from_currency IN ('ARS', 'USD'))
    AND (to_currency IS NULL OR to_currency IN ('ARS', 'USD'))
  );

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_category_required_check
  CHECK (
    (type IN ('income', 'expense') AND category_id IS NOT NULL)
    OR (type IN ('transfer', 'adjustment') AND category_id IS NULL)
  );

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_amount_shape_check
  CHECK (
    (
      type IN ('income', 'expense')
      AND amount IS NOT NULL
      AND amount > 0
      AND currency IS NOT NULL
      AND from_currency IS NULL
      AND from_amount IS NULL
      AND to_currency IS NULL
      AND to_amount IS NULL
      AND exchange_rate IS NULL
    )
    OR (
      type = 'adjustment'
      AND amount IS NOT NULL
      AND amount <> 0
      AND currency IS NOT NULL
      AND from_currency IS NULL
      AND from_amount IS NULL
      AND to_currency IS NULL
      AND to_amount IS NULL
      AND exchange_rate IS NULL
    )
    OR (
      type = 'transfer'
      AND amount IS NULL
      AND currency IS NULL
      AND from_currency IS NOT NULL
      AND from_amount IS NOT NULL
      AND from_amount > 0
      AND to_currency IS NOT NULL
      AND to_amount IS NOT NULL
      AND to_amount > 0
      AND from_currency <> to_currency
      AND exchange_rate IS NOT NULL
      AND exchange_rate > 0
    )
  );

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_expense_kind_required
  CHECK (
    type <> 'expense'
    OR date < DATE '2026-02-01'
    OR expense_kind IS NOT NULL
  );
