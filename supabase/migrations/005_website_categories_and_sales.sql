-- ============================================================
-- Add website-specific fields to products + update RPC.
--
-- New columns on public.products:
--   website_categories  text[]       -- which storefront tabs to show in.
--                                      Examples: {"מיטות יחיד"},
--                                                {"מיטות יהודיות","מיטות מעוצבות"}.
--                                      NULL/empty = use default category mapping.
--
--   is_on_sale          boolean      -- product is on sale right now.
--   discount_type       text         -- 'percentage' or 'amount'.
--   discount_value      numeric      -- 10 (=10%) OR 500 (=₪500 off each variation).
--   sale_starts_at      timestamptz  -- optional. NULL = starts immediately.
--   sale_ends_at        timestamptz  -- optional. NULL = no expiry.
--
-- Backfills website_categories so existing products keep appearing
-- under the Hebrew tab they already match.
--
-- Also updates website_get_products() to expose the new columns.
-- Safe to re-run.
-- ============================================================
BEGIN;

-- 1. Add columns (idempotent)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS website_categories text[] DEFAULT '{}'::text[];

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_on_sale boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_type text;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_discount_type_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_discount_type_check
  CHECK (discount_type IS NULL OR discount_type IN ('percentage', 'amount'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_value numeric;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_starts_at timestamptz;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;

-- 2. Backfill website_categories based on current category + bed_type
--    so that products already show under their existing Hebrew tab.
UPDATE public.products
SET website_categories = ARRAY[
  CASE
    WHEN LOWER(COALESCE(category,'')) IN ('mattress','מזרן','מזרנים') AND
         LOWER(COALESCE(bed_type,'')) IN ('single','יחיד')              THEN 'מזרני יחיד'
    WHEN LOWER(COALESCE(category,'')) IN ('mattress','מזרן','מזרנים') AND
         LOWER(COALESCE(bed_type,'')) IN ('double','זוגי')              THEN 'מזרנים זוגיים'
    WHEN LOWER(COALESCE(category,'')) IN ('bed','מיטה','מיטות') AND
         LOWER(COALESCE(bed_type,'')) IN ('single','יחיד')              THEN 'מיטות יחיד'
    WHEN LOWER(COALESCE(category,'')) IN ('bed','מיטה','מיטות') AND
         LOWER(COALESCE(bed_type,'')) IN ('double','זוגי')              THEN 'מיטות זוגיות'
    WHEN LOWER(COALESCE(category,'')) IN ('bed','מיטה','מיטות') AND
         LOWER(COALESCE(bed_type,'')) IN ('jewish','yehudit','יהודית') THEN 'מיטות יהודיות'
    WHEN LOWER(COALESCE(category,'')) IN ('bed','מיטה','מיטות') AND
         LOWER(COALESCE(bed_type,'')) IN ('designed','designer','מעוצבת') THEN 'מיטות מעוצבות'
    ELSE NULL
  END
]
WHERE website_categories IS NULL
   OR array_length(website_categories, 1) IS NULL;

-- Remove NULLs that may have slipped in (when neither branch matched)
UPDATE public.products
SET website_categories = array_remove(website_categories, NULL)
WHERE website_categories IS NOT NULL;

-- 3. Rebuild the website_get_products function to include new fields
DROP FUNCTION IF EXISTS public.website_get_products();

CREATE OR REPLACE FUNCTION public.website_get_products()
RETURNS TABLE (
  id                    uuid,
  name                  text,
  description           text,
  sku                   text,
  category              text,
  bed_type              text,
  image_url             text,
  warranty_years        int,
  features              text,
  default_variation_id  uuid,
  created_date          timestamptz,
  website_categories    text[],
  is_on_sale            boolean,
  discount_type         text,
  discount_value        numeric,
  sale_starts_at        timestamptz,
  sale_ends_at          timestamptz,
  variations            jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.description, p.sku, p.category, p.bed_type,
    p.image_url, p.warranty_years, p.features, p.default_variation_id, p.created_date,
    COALESCE(p.website_categories, '{}'::text[]) AS website_categories,
    COALESCE(p.is_on_sale, false)                AS is_on_sale,
    p.discount_type,
    p.discount_value,
    p.sale_starts_at,
    p.sale_ends_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id',         v.id,
        'product_id', v.product_id,
        'name',       v.name,
        'sku',        v.sku,
        'base_price', v.base_price,
        'final_price',v.final_price,
        'width_cm',   v.width_cm,
        'length_cm',  v.length_cm,
        'is_active',  v.is_active
      ))
      FROM public.product_variations v
      WHERE v.product_id = p.id AND v.is_active = true),
      '[]'::jsonb
    ) AS variations
  FROM public.products p
  WHERE p.is_active = true
  ORDER BY p.created_date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.website_get_products() TO anon;

NOTIFY pgrst, 'reload schema';

-- 4. Quick sanity check
SELECT
  (SELECT COUNT(*) FROM public.products WHERE is_active = true)                                    AS active_products,
  (SELECT COUNT(*) FROM public.products WHERE array_length(website_categories, 1) > 0)             AS products_with_website_category,
  (SELECT COUNT(*) FROM public.products WHERE is_on_sale = true)                                   AS products_on_sale,
  (SELECT array_agg(DISTINCT unnest) FROM (
     SELECT DISTINCT unnest(website_categories)
     FROM public.products
     WHERE array_length(website_categories,1) > 0
   ) t)                                                                                             AS distinct_website_categories;

COMMIT;
