-- ============================================================
-- Migration 020 — expose a per-variation VAT rate to the website
--
-- The storefront shows VAT-inclusive prices, but the CRM prices its
-- catalogue net: `product_variations.base_price` / `final_price` are
-- both pre-VAT. The website therefore grosses every price up in
-- `src/lib/vat.js`, using the site-wide rate (18%, overridable with
-- VITE_VAT_RATE).
--
-- `product_addons` already carries a `vat_percent` column, which
-- website_get_addons() exposes and the storefront prefers over the
-- site-wide rate. This migration does the same for variations *when
-- the column exists* — the CRM may not have it, so the function is
-- built conditionally and the storefront falls back to the site-wide
-- rate whenever the field comes back NULL/absent.
--
-- Everything else about website_get_products() is unchanged from
-- migration 011. Idempotent — DROP + CREATE.
-- ============================================================
BEGIN;

DO $migration$
DECLARE
  has_vat_column boolean;
  vat_expr       text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_variations'
      AND column_name = 'vat_percent'
  ) INTO has_vat_column;

  vat_expr := CASE WHEN has_vat_column THEN 'v.vat_percent' ELSE 'NULL::numeric' END;

  EXECUTE 'DROP FUNCTION IF EXISTS public.website_get_products()';

  EXECUTE format($fn$
    CREATE FUNCTION public.website_get_products()
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
    AS $body$
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
            'id',          v.id,
            'product_id',  v.product_id,
            'name',        v.name,
            'sku',         v.sku,
            'base_price',  v.base_price,
            'final_price', v.final_price,
            'vat_percent', %s,
            'width_cm',    v.width_cm,
            'length_cm',   v.length_cm,
            'is_active',   v.is_active
          ))
          FROM public.product_variations v
          WHERE v.product_id = p.id AND v.is_active = true),
          '[]'::jsonb
        ) AS variations
      FROM public.products p
      WHERE p.is_active = true
      ORDER BY p.created_date DESC;
    $body$;
  $fn$, vat_expr);

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.website_get_products() TO anon';

  RAISE NOTICE 'website_get_products() rebuilt; product_variations.vat_percent present: %', has_vat_column;
END
$migration$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Sanity check — the prices below are the NET figures the storefront
-- multiplies by (1 + VAT). If they already look like shelf prices, the
-- CRM is storing gross and VITE_VAT_RATE should be set to 0 instead.
SELECT
  p.name,
  v.name  AS variation,
  v.base_price,
  v.final_price
FROM public.products p
JOIN public.product_variations v ON v.product_id = p.id
WHERE p.is_active = true AND v.is_active = true
ORDER BY p.created_date DESC
LIMIT 10;
