-- ============================================================
-- Expose products.images (text[]) via the website RPC
--
-- Diagnostics confirmed:
--   * The CRM already writes the full product gallery into
--     public.products.images as text[] (Supabase Storage public URLs).
--   * The deployed website_get_products() RPC simply doesn't SELECT
--     that column, so only image_url reaches the storefront and the
--     gallery slider stays hidden.
--
-- Fix: rebuild website_get_products() with an additional
-- `images text[]` column and everything else identical to the
-- currently deployed signature (verified via pg_get_function_result).
-- Idempotent — DROP + CREATE.
-- ============================================================
BEGIN;

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
  images                text[],
  warranty_years        integer,
  features              text,
  hardness              integer,
  has_trial_period      boolean,
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
    p.id,
    p.name,
    p.description,
    p.sku,
    p.category,
    -- bed_type is stored as text[] in the CRM; flatten to a single
    -- text value (first element) to match the existing RPC shape so
    -- the website's mapCategoryToHebrew keeps working unchanged.
    CASE
      WHEN p.bed_type IS NULL THEN NULL
      WHEN array_length(p.bed_type, 1) IS NULL THEN NULL
      ELSE p.bed_type[1]
    END AS bed_type,
    p.image_url,
    COALESCE(p.images, '{}'::text[]) AS images,
    p.warranty_years,
    p.features,
    p.hardness,
    COALESCE(p.has_trial_period, false) AS has_trial_period,
    p.default_variation_id,
    p.created_date,
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

-- Sanity check
SELECT
  COUNT(*) FILTER (WHERE is_active = true)                                    AS active_products,
  COUNT(*) FILTER (WHERE COALESCE(array_length(images, 1), 0) > 0)            AS products_with_gallery,
  COUNT(*) FILTER (WHERE COALESCE(array_length(images, 1), 0) >= 2)           AS products_with_slider_eligible
FROM public.products;

COMMIT;
