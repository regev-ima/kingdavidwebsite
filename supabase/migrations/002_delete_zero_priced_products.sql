-- ============================================================
-- Delete all products whose variations are all priced at 0 (or NULL).
--
-- - Identifies products where NO active+priced variation exists.
-- - Sets default_variation_id = NULL first (avoid FK blockage).
-- - Deletes product_variations rows.
-- - Deletes products rows.
-- - Reports what was removed.
--
-- Orders are NOT affected: orders.items is a JSONB snapshot that does
-- not hold a foreign key to products, so historical orders are safe.
-- ============================================================
BEGIN;

-- Identify target product IDs
CREATE TEMP TABLE _products_to_delete ON COMMIT DROP AS
SELECT p.id, p.name, p.sku, p.category, p.bed_type
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.product_variations v
  WHERE v.product_id = p.id
    AND COALESCE(v.base_price, 0) > 0
);

-- Preview — the rows that are about to be deleted
SELECT 'WILL DELETE' AS status, name, sku, category, bed_type
FROM _products_to_delete
ORDER BY category NULLS LAST, bed_type NULLS LAST, name;

-- Clear any default_variation_id pointers so the variation delete isn't blocked
UPDATE public.products
SET default_variation_id = NULL
WHERE id IN (SELECT id FROM _products_to_delete);

-- Delete the variations of those products
DELETE FROM public.product_variations
WHERE product_id IN (SELECT id FROM _products_to_delete);

-- Delete the products themselves
DELETE FROM public.products
WHERE id IN (SELECT id FROM _products_to_delete);

-- Summary
SELECT
  (SELECT COUNT(*) FROM _products_to_delete) AS products_deleted,
  (SELECT COUNT(*) FROM public.products)     AS products_remaining,
  (SELECT COUNT(*) FROM public.product_variations
    WHERE COALESCE(base_price, 0) = 0)       AS zero_priced_variations_remaining,
  (SELECT COUNT(*) FROM public.product_variations
    WHERE base_price > 0)                    AS priced_variations_remaining;

COMMIT;
