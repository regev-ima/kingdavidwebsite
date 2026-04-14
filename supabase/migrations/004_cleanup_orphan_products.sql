-- ============================================================
-- Delete orphan products created by migration 003.
--
-- An "orphan" is a product with NO variations.
-- These were created when the sheet's product_name did not exactly
-- match an existing product name, but the sheet's SKU (e.g. 3MK140190-S)
-- already existed on a different product. Result: new product created,
-- but no variations inserted because the SKU check found the existing ones.
--
-- Safe to run — orphans can't be purchased anyway (cart requires a variation).
-- ============================================================
BEGIN;

CREATE TEMP TABLE _orphans ON COMMIT DROP AS
SELECT p.id, p.name, p.category, p.bed_type, p.created_date
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_variations v
  WHERE v.product_id = p.id
);

-- Preview what will be deleted
SELECT 'WILL DELETE (no variations)' AS status,
       name, category, bed_type, created_date
FROM _orphans
ORDER BY created_date DESC NULLS LAST, name;

-- Delete the orphan products
DELETE FROM public.products
WHERE id IN (SELECT id FROM _orphans);

-- Report
SELECT
  (SELECT COUNT(*) FROM _orphans)                               AS orphans_deleted,
  (SELECT COUNT(*) FROM public.products WHERE is_active = true) AS active_products_now,
  (SELECT COUNT(*) FROM public.product_variations
   WHERE is_active = true AND base_price > 0)                   AS priced_variations_now;

COMMIT;
