-- 05_create_opening_balance_overrides.sql
-- Create table for manual opening balance overrides
CREATE TABLE IF NOT EXISTS opening_balance_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL,
  ars_amount numeric(12,2) NOT NULL DEFAULT 0,
  usd_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint per budget/month/year
CREATE UNIQUE INDEX IF NOT EXISTS opening_balance_overrides_budget_year_month_idx
  ON opening_balance_overrides (budget_id, year, month);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON opening_balance_overrides;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON opening_balance_overrides
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
