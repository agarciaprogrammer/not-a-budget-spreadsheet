-- Add is_active flag and deactivate legacy/duplicate categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

WITH allowed_categories(name) AS (
  VALUES
    -- Fixed (ES)
    ('Expensas'),
    ('Servicios - Luz'),
    ('Servicios - Gas'),
    ('Servicios - Agua'),
    ('Internet'),
    ('Teléfono móvil'),
    ('Obra social / Salud'),
    ('Suscripciones esenciales'),
    -- Variable (ES)
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
    ('Ropa'),
    -- Income (EN)
    ('Salary'),
    ('Freelance'),
    ('Investment Returns'),
    ('Bonus'),
    ('Side Hustle'),
    ('Investment')
)
UPDATE public.categories
SET is_active = false
WHERE name NOT IN (SELECT name FROM allowed_categories);
