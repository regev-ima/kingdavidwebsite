-- ============================================================
-- Blog posts — storefront blog content imported from the legacy
-- WordPress site.
--
-- As with the other storefront tables, the website is anon-only
-- and cannot read the table directly — it calls dedicated
-- SECURITY DEFINER functions:
--
--   website_list_blog_posts(p_limit int)          -> public.blog_posts[]
--   website_get_blog_post(p_id uuid)              -> public.blog_posts
--
-- Mirror this migration in the kcrm (CRM) repo so both environments
-- share the exact same schema.
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id  integer UNIQUE,                    -- original WordPress post ID, for idempotent re-import
  title           text NOT NULL,
  slug            text UNIQUE,
  excerpt         text,
  content         text NOT NULL,                     -- sanitized HTML
  category        text,
  image_url       text,
  published_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx     ON public.blog_posts (category);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
-- No public policies: all anon access is mediated by the RPCs below.

DROP FUNCTION IF EXISTS public.website_list_blog_posts(integer);
DROP FUNCTION IF EXISTS public.website_get_blog_post(uuid);

CREATE OR REPLACE FUNCTION public.website_list_blog_posts(p_limit integer DEFAULT 50)
RETURNS SETOF public.blog_posts
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.blog_posts
  ORDER BY published_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
$$;

CREATE OR REPLACE FUNCTION public.website_get_blog_post(p_id uuid)
RETURNS public.blog_posts
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.blog_posts WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.website_list_blog_posts(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.website_get_blog_post(uuid)      TO anon;

NOTIFY pgrst, 'reload schema';

COMMIT;
