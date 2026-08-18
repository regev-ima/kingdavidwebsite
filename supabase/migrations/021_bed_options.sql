-- ============================================================
-- Migration 021 — expose the bed configurator to the storefront
--
-- The CRM's bed questions (ארגז מצעים, הפרדה יהודית, …) live in
-- bed_option_groups / bed_option_values, whose RLS grants SELECT to
-- `authenticated` only. The website runs on the anon key and cannot
-- read them at all, which is why a customer buying a bed never had
-- these fields.
--
-- SECURITY — READ BEFORE EDITING
--
-- This function is SECURITY DEFINER, so it bypasses RLS by design. That
-- makes THE COLUMN LIST BELOW the security boundary, and nothing else.
-- Two columns must never appear in it:
--
--     note, note_type   — internal sales coaching written for reps
--                         ("מסגרת שלמה חזקה יותר אך יקרה יותר").
--                         Returning them publishes the sales script to
--                         every visitor.
--
-- Also withheld: addon_id (internal catalog linkage), field_type /
-- options (text questions are not exposed at all), created_date.
--
-- Therefore: never `SELECT *`, never `SELECT t.*`, and never add a
-- column here without deciding, deliberately, that a customer may read
-- it. A column added to the table later is not returned by default —
-- which is the point.
--
-- WHAT IS EXPOSED
--
-- Only questions the CRM has explicitly published (website_mode 'ask'
-- or 'auto' — the column defaults to 'hidden'), only active rows, and
-- only single-choice questions. `price` is resolved to ONE convention:
-- VAT-INCLUSIVE, always. A manual price is already stored that way; a
-- choice linked to an add-on has the add-on's net price grossed up
-- here. The storefront must therefore NOT apply withVat() to it.
--
-- Note on add-on linked choices: this resolves the add-on's base/final
-- price and does not consult its per-size overrides. Size-dependent
-- pricing on the website is expressed with min_width_cm/max_width_cm on
-- the choices instead (see the 'auto' mode), which is the mechanism the
-- storefront actually uses.
--
-- Idempotent — DROP + CREATE.
-- ============================================================
BEGIN;

DROP FUNCTION IF EXISTS public.website_get_bed_options();

CREATE FUNCTION public.website_get_bed_options()
RETURNS TABLE (
  group_id              uuid,
  group_key             text,
  group_label           text,
  group_sort_order      integer,
  skippable             boolean,
  website_mode          text,
  depends_on_group_key  text,
  depends_on_value_key  text,
  value_id              uuid,
  value_key             text,
  value_label           text,
  price                 numeric,
  image_url             text,
  value_sort_order      integer,
  min_width_cm          integer,
  max_width_cm          integer
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    g.id,
    g.key,
    g.label,
    g.sort_order,
    g.skippable,
    g.website_mode,
    g.depends_on_group_key,
    g.depends_on_value_key,
    v.id,
    v.key,
    v.label,
    -- One convention out: VAT-inclusive. Manual prices are stored that
    -- way already; an add-on's net price is grossed up here.
    CASE
      WHEN v.addon_id IS NOT NULL THEN
        ROUND(COALESCE(a.final_price, a.base_price, 0) * (1 + COALESCE(a.vat_percent, 18) / 100.0))
      ELSE COALESCE(v.price, 0)
    END,
    v.image_url,
    v.sort_order,
    v.min_width_cm,
    v.max_width_cm
  FROM public.bed_option_groups g
  JOIN public.bed_option_values v ON v.group_id = g.id
  LEFT JOIN public.product_addons a ON a.id = v.addon_id
  WHERE g.is_active = true
    AND v.is_active = true
    AND COALESCE(g.input_type, 'choice') = 'choice'
    AND COALESCE(g.website_mode, 'hidden') IN ('ask', 'auto')
  ORDER BY g.sort_order, v.sort_order;
$$;

REVOKE ALL ON FUNCTION public.website_get_bed_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.website_get_bed_options() TO anon;
GRANT EXECUTE ON FUNCTION public.website_get_bed_options() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
