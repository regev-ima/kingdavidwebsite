-- ============================================================
-- Add per-product detail fields so the storefront can stop showing
-- generic hardcoded copy on every product page. Four new nullable
-- text columns on products, all managed by the CRM / ERP:
--
--   fabric_type    -- single line, e.g. "כותנה איכותי"
--   technologies   -- newline-separated, each line "Name" or
--                     "Name | Description"
--   materials      -- newline-separated list (was hardcoded in UI)
--   support_zones  -- newline-separated list (was hardcoded in UI)
--
-- Everything is additive and idempotent. Products that leave a
-- column NULL simply don't render that section on the website.
-- ============================================================
BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fabric_type    text,
  ADD COLUMN IF NOT EXISTS technologies   text,
  ADD COLUMN IF NOT EXISTS materials      text,
  ADD COLUMN IF NOT EXISTS support_zones  text;

-- Rebuild website_get_products() so the anon website can read the
-- new columns. Keep every existing returned column identical to
-- the currently deployed signature (matches migration 011).
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
  fabric_type           text,
  technologies          text,
  materials             text,
  support_zones         text,
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
    p.fabric_type,
    p.technologies,
    p.materials,
    p.support_zones,
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
  COUNT(*) FILTER (WHERE is_active = true)                             AS active_products,
  COUNT(*) FILTER (WHERE fabric_type    IS NOT NULL AND fabric_type    <> '') AS with_fabric_type,
  COUNT(*) FILTER (WHERE technologies   IS NOT NULL AND technologies   <> '') AS with_technologies,
  COUNT(*) FILTER (WHERE materials      IS NOT NULL AND materials      <> '') AS with_materials,
  COUNT(*) FILTER (WHERE support_zones  IS NOT NULL AND support_zones  <> '') AS with_support_zones
FROM public.products;

COMMIT;
