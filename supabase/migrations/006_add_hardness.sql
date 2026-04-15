-- ============================================================
-- Add a `hardness` numeric level (1–10) to products and expose it
-- through website_get_products(). The website already has the UI
-- to render both a numeric bar and a descriptive label — it just
-- needs the column to show up.
-- ============================================================
BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS hardness integer;

-- Optional sanity range (nullable stays allowed, but if set must be 1..10)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_hardness_range;
ALTER TABLE public.products
  ADD CONSTRAINT products_hardness_range
  CHECK (hardness IS NULL OR (hardness BETWEEN 1 AND 10));

-- Refresh the RPC so the website can read the new column
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
  hardness              int,
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
    p.image_url, p.warranty_years, p.features,
    p.hardness,
    p.default_variation_id, p.created_date,
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

-- Quick sanity check
SELECT
  (SELECT COUNT(*) FROM public.products WHERE is_active = true)       AS active_products,
  (SELECT COUNT(*) FROM public.products WHERE hardness IS NOT NULL)   AS products_with_hardness;

COMMIT;
