-- ============================================================
-- Expose product add-ons (e.g. "ארגז מצעים") to the website via an
-- RPC that reads both product_addons and product_addon_prices.
--
-- The website stays read-only on these tables; the CRM continues to
-- manage the catalogue.
-- ============================================================
BEGIN;

DROP FUNCTION IF EXISTS public.website_get_addons();

CREATE OR REPLACE FUNCTION public.website_get_addons()
RETURNS TABLE (
  id                    uuid,
  name                  text,
  description           text,
  base_price            numeric,
  final_price           numeric,
  vat_percent           numeric,
  sort_order            integer,
  categories            jsonb,
  applicable_categories jsonb,
  size_prices           jsonb,
  -- Per-size table joined in. NULL if no overrides.
  variation_prices      jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    a.id,
    a.name,
    a.description,
    a.base_price,
    a.final_price,
    a.vat_percent,
    a.sort_order,
    a.categories,
    a.applicable_categories,
    a.size_prices,
    (
      SELECT jsonb_object_agg(pp.size_id::text, pp.price)
      FROM public.product_addon_prices pp
      WHERE pp.addon_id = a.id
    ) AS variation_prices
  FROM public.product_addons a
  WHERE a.is_active = true
  ORDER BY COALESCE(a.sort_order, 999), a.name;
$$;

GRANT EXECUTE ON FUNCTION public.website_get_addons() TO anon;

NOTIFY pgrst, 'reload schema';

-- Sanity check: how many active addons exist?
SELECT
  COUNT(*) FILTER (WHERE is_active = true) AS active_addons,
  COUNT(*)                                 AS total_addons
FROM public.product_addons;

COMMIT;
