-- ============================================================
-- DIAGNOSTIC (read-only) — why don't bed addons ("הפרדה יהודית",
-- "ארגז מצעים") show up on a bed's product page?
--
-- The storefront filters addons in `addonsForProduct()`
-- (src/api/base44Client.js) by comparing the addon's
-- `applicable_categories` against the product's categories. The two
-- sides come from different vocabularies:
--
--   product (website) : 'מיטות יהודיות', 'מיטות זוגיות', 'מיטות מעוצבות'
--                       (products.website_categories — the storefront tab)
--   product (CRM raw) : category='bed' | 'מיטה', bed_type='jewish' | 'יהודית'
--   addon             : product_addons.applicable_categories — whatever the
--                       CRM writes there
--
-- The client now normalises case/whitespace and lets a broad tag
-- ('bed', 'מיטה', 'מיטות') match every storefront tab in that family,
-- so a mismatch of *vocabulary* is handled. This script confirms the
-- actual values, which is the part the website can't see.
--
-- Run in the Supabase SQL editor and paste the output back.
-- It does NOT modify any data.
-- ============================================================

-- 1. Are the bed addons active at all? An addon with is_active = false
--    is filtered out by website_get_addons() and never reaches the site.
SELECT
  id,
  name,
  is_active,
  base_price,
  final_price,
  sort_order,
  applicable_categories,
  categories,
  jsonb_typeof(to_jsonb(applicable_categories)) AS applicable_categories_type
FROM public.product_addons
ORDER BY is_active DESC, COALESCE(sort_order, 999), name;

-- 2. The exact category labels the addons are tagged with, flattened.
--    Compare these against the product labels in query 3.
SELECT DISTINCT
  jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(applicable_categories) = 'array'
         THEN applicable_categories
         ELSE '[]'::jsonb END
  ) AS addon_category_label
FROM public.product_addons
WHERE is_active = true
ORDER BY 1;

-- 3. The category labels the bed products actually carry.
SELECT
  category                       AS crm_category,
  bed_type                       AS crm_bed_type,
  website_categories             AS storefront_tabs,
  COUNT(*)                       AS products
FROM public.products
WHERE is_active = true
GROUP BY category, bed_type, website_categories
ORDER BY crm_category, crm_bed_type;

-- 4. Per-size addon price overrides. If an addon shows but is priced at
--    0 for every size, the row exists but product_addon_prices is empty.
SELECT
  a.name        AS addon,
  COUNT(pp.*)   AS size_price_rows,
  MIN(pp.price) AS min_price,
  MAX(pp.price) AS max_price
FROM public.product_addons a
LEFT JOIN public.product_addon_prices pp ON pp.addon_id = a.id
WHERE a.is_active = true
GROUP BY a.name
ORDER BY a.name;
