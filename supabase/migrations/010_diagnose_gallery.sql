-- ============================================================
-- DIAGNOSTIC (read-only) — where does the CRM store gallery images?
--
-- The website's website_get_products() RPC only returns the primary
-- `image_url` — the product gallery (2nd / 3rd / … image uploaded via
-- the kcrm admin UI) never reaches the storefront. This script
-- inspects the schema so we know which column / table to wire into
-- the RPC.
--
-- Run this in the Supabase SQL editor (or via `supabase db execute`)
-- and paste the output back so we can patch 011.
-- It does NOT modify any data.
-- ============================================================

-- 1. Every column on the products table (looking for images / gallery
--    / media / photos etc. — any jsonb/text[]/text column we missed).
SELECT
  ordinal_position AS pos,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- 2. Any separate table that could hold additional product images.
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
       table_name ILIKE '%image%'
    OR table_name ILIKE '%media%'
    OR table_name ILIKE '%photo%'
    OR table_name ILIKE '%gallery%'
    OR table_name ILIKE '%attachment%'
    OR table_name ILIKE '%asset%'
  );

-- 3. What the current website_get_products() RPC actually returns —
--    confirms whether the `images` column exists in the return shape.
SELECT pg_get_function_result(p.oid) AS return_shape
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'website_get_products';

-- 4. Snapshot of the "מיטת מתכווננת (זוגי)" product — all its
--    non-null column values, so we can spot where the 2nd image
--    URL really lives.
SELECT to_jsonb(p) AS raw_product
FROM public.products p
WHERE p.name ILIKE '%מתכוונ%'
LIMIT 3;

-- 5. Any Supabase Storage objects that look like they belong to this
--    product (useful if the CRM uploads to storage + writes a URL to
--    a column we haven't checked yet).
SELECT bucket_id, name, metadata
FROM storage.objects
WHERE name ILIKE '%מתכוונ%'
   OR name ILIKE '%adjustable%'
LIMIT 20;
