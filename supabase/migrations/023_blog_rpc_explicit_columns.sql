-- ============================================================
-- Migration 023 — name the columns the blog RPCs return
--
-- The three blog functions returned `SETOF public.blog_posts` with
-- `SELECT *`, so their output shape was whatever the table happened to
-- hold. They are SECURITY DEFINER and granted to anon, which makes that
-- a standing decision to publish any column added to blog_posts later —
-- a draft flag, an internal note, an author's email — without anyone
-- choosing to.
--
-- Nothing is known to have leaked. This closes the door rather than
-- reports a break-in: the storefront reads exactly eight fields (see
-- mapBlogRow in src/api/base44Client.js), so those eight are what goes
-- out. A column added to the table from now on is withheld by default,
-- and publishing it becomes a deliberate edit here.
--
-- Behaviour is otherwise identical: same names, same arguments, same
-- ordering, same limit clamp. Only the projection narrows.
--
-- The return type changes, so these are DROP + CREATE rather than
-- CREATE OR REPLACE, which cannot alter a function's result type.
-- ============================================================
BEGIN;

DROP FUNCTION IF EXISTS public.website_list_blog_posts(integer);
DROP FUNCTION IF EXISTS public.website_get_blog_post(uuid);
DROP FUNCTION IF EXISTS public.website_get_blog_post_by_slug(text);

CREATE FUNCTION public.website_list_blog_posts(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id           uuid,
  title        text,
  slug         text,
  excerpt      text,
  content      text,
  category     text,
  image_url    text,
  published_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.category, b.image_url, b.published_at
  FROM public.blog_posts b
  ORDER BY b.published_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
$$;

CREATE FUNCTION public.website_get_blog_post(p_id uuid)
RETURNS TABLE (
  id           uuid,
  title        text,
  slug         text,
  excerpt      text,
  content      text,
  category     text,
  image_url    text,
  published_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.category, b.image_url, b.published_at
  FROM public.blog_posts b
  WHERE b.id = p_id;
$$;

CREATE FUNCTION public.website_get_blog_post_by_slug(p_slug text)
RETURNS TABLE (
  id           uuid,
  title        text,
  slug         text,
  excerpt      text,
  content      text,
  category     text,
  image_url    text,
  published_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.category, b.image_url, b.published_at
  FROM public.blog_posts b
  WHERE b.slug = p_slug;
$$;

REVOKE ALL ON FUNCTION public.website_list_blog_posts(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.website_get_blog_post(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.website_get_blog_post_by_slug(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.website_list_blog_posts(integer)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.website_get_blog_post(uuid)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.website_get_blog_post_by_slug(text)  TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
