-- ============================================================
-- Migration 022 — carry products.bed_options to the storefront
--
-- website_get_bed_options() (migration 021) tells the site WHICH bed
-- questions exist. It cannot say which questions a PARTICULAR bed asks —
-- that lives on the product, in products.bed_options, and
-- website_get_products() returns an explicit column list that does not
-- include it. Without this the site would offer a storage box on a bed
-- the CRM had switched it off for.
--
-- bed_options stores only the EXCEPTIONS — {"storage_box": false}. A key
-- that is absent means the question applies, so '{}' (the default, and
-- what every existing bed has) means "ask everything", and the storefront
-- can treat a missing column exactly the same way.
--
-- Built conditionally on the column existing, the same way migration 020
-- handles product_variations.vat_percent: the CRM applies its migrations
-- on its own merge, so this must not break if it lands first. When the
-- column is absent the function returns '{}' and the site behaves as it
-- does today.
--
-- Everything else about website_get_products() is unchanged from
-- migration 020. Idempotent — DROP + CREATE.
-- ============================================================
BEGIN;

DO $migration$
DECLARE
  has_vat_column  boolean;
  has_bed_options boolean;
  vat_expr        text;
  bed_expr        text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variations' AND column_name = 'vat_percent'
  ) INTO has_vat_column;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'bed_options'
  ) INTO has_bed_options;

  vat_expr := CASE WHEN has_vat_column  THEN 'v.vat_percent' ELSE 'NULL::numeric' END;
  bed_expr := CASE WHEN has_bed_options THEN 'COALESCE(p.bed_options, ''{}''::jsonb)' ELSE '''{}''::jsonb' END;

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
      bed_options           jsonb,
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
        %s AS bed_options,
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
  $fn$, bed_expr, vat_expr);

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.website_get_products() TO anon';

  RAISE NOTICE 'website_get_products() rebuilt; products.bed_options present: %', has_bed_options;
END
$migration$;

NOTIFY pgrst, 'reload schema';

COMMIT;
