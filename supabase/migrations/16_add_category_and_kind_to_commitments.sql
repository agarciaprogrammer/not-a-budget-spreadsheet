-- Migration 16: Add category_id, expense_kind, and card_label to public.commitments

ALTER TABLE public.commitments
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expense_kind text CHECK (expense_kind IN ('variable', 'fixed')),
  ADD COLUMN IF NOT EXISTS card_label text;

-- Create index for performance
CREATE INDEX IF NOT EXISTS commitments_category_id_idx ON public.commitments(category_id);
