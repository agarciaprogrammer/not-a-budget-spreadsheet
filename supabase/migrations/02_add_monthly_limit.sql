-- Add monthly_limit field to budgets table
ALTER TABLE budgets
  ADD COLUMN monthly_limit NUMERIC(12,2) DEFAULT NULL; 