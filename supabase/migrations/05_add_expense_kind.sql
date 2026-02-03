-- Add expense_kind to categories and transactions
ALTER TABLE public.categories
  ADD COLUMN expense_kind TEXT CHECK (expense_kind IN ('fixed', 'variable')) DEFAULT NULL;

ALTER TABLE public.transactions
  ADD COLUMN expense_kind TEXT CHECK (expense_kind IN ('fixed', 'variable')) DEFAULT NULL;

-- Require expense_kind for expenses from February 2026 onwards
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_expense_kind_required
  CHECK (
    type <> 'expense'
    OR date < DATE '2026-02-01'
    OR expense_kind IS NOT NULL
  );
