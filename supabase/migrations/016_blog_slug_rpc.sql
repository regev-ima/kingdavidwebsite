-- ============================================================
-- Slug-based blog post lookup for SEO-friendly URLs
-- (/blog/:slug instead of /BlogPost?id=<uuid>).
--
-- Mirror into the kcrm repo.
-- ============================================================
BEGIN;

DROP FUNCTION IF EXISTS public.website_get_blog_post_by_slug(text);

CREATE OR REPLACE FUNCTION public.website_get_blog_post_by_slug(p_slug text)
RETURNS public.blog_posts
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.blog_posts WHERE slug = p_slug;
$$;

GRANT EXECUTE ON FUNCTION public.website_get_blog_post_by_slug(text) TO anon;

NOTIFY pgrst, 'reload schema';

COMMIT;
