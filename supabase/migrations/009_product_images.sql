-- ============================================================
-- Add a product gallery column + expose it via the website RPC.
--
-- products.images is a jsonb array of public image URLs that become
-- the gallery slider on the product detail page. The single
-- products.image_url stays the primary/cover image (used on cards).
--
-- Safe if the column already exists (idempotent IF NOT EXISTS).
-- ============================================================
BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Refresh the RPC so the new column flows to the website.
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
  images                jsonb,
  warranty_years        int,
  features              text,
  hardness              int,
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
    p.id, p.name, p.description, p.sku, p.category, p.bed_type,
    p.image_url,
    COALESCE(p.images, '[]'::jsonb) AS images,
    p.warranty_years, p.features,
    p.hardness,
    COALESCE(p.has_trial_period, false) AS has_trial_period,
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

SELECT
  COUNT(*) FILTER (WHERE is_active = true)                      AS active_products,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(images,'[]'::jsonb)) > 0) AS products_with_gallery
FROM public.products;

COMMIT;
