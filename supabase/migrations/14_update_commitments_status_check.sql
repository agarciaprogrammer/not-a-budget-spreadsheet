-- Drop existing status check constraint from commitments
ALTER TABLE public.commitments
  DROP CONSTRAINT IF EXISTS commitments_status_check;

-- Add updated check constraint to allow 'partial' status
ALTER TABLE public.commitments
  ADD CONSTRAINT commitments_status_check
  CHECK (status IN ('pending', 'partial', 'completed'));
