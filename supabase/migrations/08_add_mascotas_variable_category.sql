-- Add "Pet" as a variable expense category for all users (idempotent)
-- Also normalize any previous "Mascotas" rows to "Pet".

-- If both names exist for a user, remove the legacy "Mascotas" duplicate.
DELETE FROM public.categories old_c
USING public.categories new_c
WHERE old_c.user_id = new_c.user_id
  AND old_c.name = 'Mascotas'
  AND new_c.name = 'Pet';

-- Rename remaining "Mascotas" rows to "Pet".
UPDATE public.categories
SET name = 'Pet'
WHERE name = 'Mascotas';

UPDATE public.categories
SET expense_kind = 'variable',
    is_active = true
WHERE name = 'Pet'
  AND (
    expense_kind IS DISTINCT FROM 'variable'
    OR is_active IS DISTINCT FROM true
  );

INSERT INTO public.categories (name, user_id, expense_kind, is_active)
SELECT 'Pet', u.id, 'variable', true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories c
  WHERE c.user_id = u.id
    AND c.name = 'Pet'
);
