-- Seed fixed/variable categories for existing users (idempotent)

-- Ensure existing categories get the correct kind
WITH fixed_categories(name) AS (
  VALUES
    ('Expensas'),
    ('Servicios - Luz'),
    ('Servicios - Gas'),
    ('Servicios - Agua'),
    ('Internet'),
    ('Teléfono móvil'),
    ('Obra social / Salud'),
    ('Suscripciones esenciales')
)
UPDATE public.categories
SET expense_kind = 'fixed'
WHERE name IN (SELECT name FROM fixed_categories)
  AND (expense_kind IS DISTINCT FROM 'fixed');

WITH variable_categories(name) AS (
  VALUES
    ('Pedidos / Delivery'),
    ('Salidas'),
    ('Supermercado'),
    ('Gustos personales'),
    ('Libros'),
    ('Tecnologia'),
    ('Música'),
    ('Compras para el hogar'),
    ('Transporte'),
    ('Compras duraderas'),
    ('Regalos'),
    ('Ropa')
)
UPDATE public.categories
SET expense_kind = 'variable'
WHERE name IN (SELECT name FROM variable_categories)
  AND (expense_kind IS DISTINCT FROM 'variable');

-- Insert missing fixed categories per user
WITH
  fixed_categories(name) AS (
    VALUES
      ('Expensas'),
      ('Servicios - Luz'),
      ('Servicios - Gas'),
      ('Servicios - Agua'),
      ('Internet'),
      ('Teléfono móvil'),
      ('Obra social / Salud'),
      ('Suscripciones esenciales')
  ),
  users AS (
    SELECT id AS user_id FROM auth.users
  )
INSERT INTO public.categories (name, user_id, expense_kind)
SELECT fc.name, u.user_id, 'fixed'
FROM fixed_categories fc
CROSS JOIN users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories c
  WHERE c.user_id = u.user_id
    AND c.name = fc.name
);

-- Insert missing variable categories per user
WITH
  variable_categories(name) AS (
    VALUES
      ('Pedidos / Delivery'),
      ('Salidas'),
      ('Supermercado'),
      ('Gustos personales'),
      ('Libros'),
      ('Tecnologia'),
      ('Música'),
      ('Compras para el hogar'),
      ('Transporte'),
      ('Compras duraderas'),
      ('Regalos'),
      ('Ropa')
  ),
  users AS (
    SELECT id AS user_id FROM auth.users
  )
INSERT INTO public.categories (name, user_id, expense_kind)
SELECT vc.name, u.user_id, 'variable'
FROM variable_categories vc
CROSS JOIN users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories c
  WHERE c.user_id = u.user_id
    AND c.name = vc.name
);
