-- ============================================================
-- Product attribute catalog + per-product selection (checkbox model)
--
-- Replaces the earlier hardcoded copy on the product page with a
-- two-table schema that the ERP fully manages:
--
--   product_attribute_catalog  -- master list of every possible
--                                 technology, fabric property,
--                                 composition layer, transition
--                                 layer, or body-support feature.
--                                 Each row has its own description.
--
--   product_attribute_links    -- many-to-many: which catalog rows
--                                 are "ticked" for each product.
--
-- On the website the five tabs on the product page
-- (טכנולוגיה / בד / הרכב / שכבות מעבר / תמיכה לגוף) are rendered
-- from this data via website_get_products().
--
-- Everything is additive and idempotent.
-- ============================================================
BEGIN;

-- ----------------------------------------------------------------
-- 1. Catalog — master list of attributes grouped by tab.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_attribute_catalog (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category       text NOT NULL,
  name           text NOT NULL,
  description    text,
  display_order  integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_attribute_catalog
  DROP CONSTRAINT IF EXISTS product_attribute_catalog_category_check;
ALTER TABLE public.product_attribute_catalog
  ADD CONSTRAINT product_attribute_catalog_category_check
  CHECK (category IN (
    'technology',
    'fabric',
    'composition',
    'transition_layer',
    'support_feature'
  ));

CREATE INDEX IF NOT EXISTS product_attribute_catalog_category_idx
  ON public.product_attribute_catalog (category, display_order)
  WHERE is_active = true;

-- ----------------------------------------------------------------
-- 2. Junction — which attributes are selected for each product.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_attribute_links (
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id  uuid NOT NULL REFERENCES public.product_attribute_catalog(id) ON DELETE CASCADE,
  created_date  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS product_attribute_links_attribute_idx
  ON public.product_attribute_links (attribute_id);

-- ----------------------------------------------------------------
-- 3. RLS — anon website can read the catalog and the links, but
--    only the RPC path is exercised in practice. Writes remain
--    gated to authenticated ERP roles (handled in kcrm).
-- ----------------------------------------------------------------
ALTER TABLE public.product_attribute_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_links   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can read active catalog" ON public.product_attribute_catalog;
CREATE POLICY "anon can read active catalog"
  ON public.product_attribute_catalog
  FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "anon can read links" ON public.product_attribute_links;
CREATE POLICY "anon can read links"
  ON public.product_attribute_links
  FOR SELECT
  TO anon
  USING (true);

-- ----------------------------------------------------------------
-- 4. Refresh website_get_products() so each row carries the
--    grouped list of selected attributes. Shape:
--      attributes JSONB = [
--        { "category": "technology",
--          "name": "מולטי לטקס",
--          "description": "...",
--          "display_order": 0 },
--        ...
--      ]
-- ----------------------------------------------------------------
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
  variations            jsonb,
  attributes            jsonb
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
      ) ORDER BY v.width_cm, v.length_cm)
      FROM public.product_variations v
      WHERE v.product_id = p.id AND v.is_active = true),
      '[]'::jsonb
    ) AS variations,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'category',      c.category,
        'name',          c.name,
        'description',   c.description,
        'display_order', c.display_order
      ) ORDER BY c.category, c.display_order, c.name)
      FROM public.product_attribute_links l
      JOIN public.product_attribute_catalog c ON c.id = l.attribute_id
      WHERE l.product_id = p.id AND c.is_active = true),
      '[]'::jsonb
    ) AS attributes
  FROM public.products p
  WHERE p.is_active = true
  ORDER BY p.created_date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.website_get_products() TO anon;

NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------
-- Sanity check
-- ----------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM public.product_attribute_catalog WHERE is_active = true) AS active_attributes,
  (SELECT COUNT(*) FROM public.product_attribute_links)                          AS product_attribute_rows,
  (SELECT COUNT(DISTINCT product_id) FROM public.product_attribute_links)        AS products_with_attributes;

COMMIT;
